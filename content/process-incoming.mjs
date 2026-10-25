#!/usr/bin/env node
// Publish, update or withdraw what Pipeline has dropped into content/incoming/.
//
//   node content/process-incoming.mjs
//
// ISSUES   content/incoming/<slug>.json      an approved issue (Pipeline's format) -> content/issues/<slug>.json
//          content/incoming/<slug>.withdraw  take the issue down (file, index entry, default follow, merges into it)
// MEETINGS content/incoming/meetings/<videoId>.json      an approved recap -> content/meetings/<videoId>.json
//          content/incoming/meetings/<videoId>.withdraw  take the meeting down
//
// INDEX    content/incoming/index-changes.json  { "merge": {"old-slug": "new-slug"}, "unmerge": ["old-slug"], "defaultFollows": ["slug", ...] }
//          merges point an old address at a published issue; defaultFollows REPLACES the list new users follow (max 5).
//
// Every file goes through the same checks as `publish-issue.mjs` / `publish-meeting.mjs`, including the producer's
// election hold. Good files leave incoming/. A file that fails a check is moved to content/rejected/ (meetings:
// content/rejected/meetings/) with <name>.reason.txt saying why, and nothing about it goes live.
// Run by .github/workflows/publish-incoming.yml whenever Pipeline pushes to content/incoming/.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { refreshFeed, refreshMeetingsFeed } from './feed.mjs';
import { campaignHit } from './campaign.mjs';
import { buildPublishedIssue } from './publish-issue.mjs';
import { buildPublished as buildPublishedMeeting } from './publish-meeting.mjs';

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const INDEX_CHANGES = 'index-changes.json';
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

/** The same election hold for a recap, which has no fixed text fields: look at every string in it. */
function meetingElectionHit(value) {
  const hits = [];
  const walk = v => {
    if (typeof v === 'string') { const m = campaignHit(v); if (m) hits.push(m); }
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(value);
  return hits[0] ?? null;
}

function sweep(dir, ext) {
  return existsSync(dir) ? readdirSync(dir).filter(n => n.endsWith(ext)).sort() : [];
}

/** Moves a failed file out of incoming/ and records why. */
function reject(from, rejectedDir, name, reason) {
  mkdirSync(rejectedDir, { recursive: true });
  const stem = name.replace(/\.(json|withdraw)$/, '');
  if (existsSync(from)) renameSync(from, join(rejectedDir, name));
  writeFileSync(join(rejectedDir, `${stem}.reason.txt`), `${reason}\n`);
}

/** A name that now passes no longer needs an old rejection record. */
function clearRejection(rejectedDir, stem) {
  for (const n of [`${stem}.json`, `${stem}.withdraw`, `${stem}.reason.txt`]) if (existsSync(join(rejectedDir, n))) rmSync(join(rejectedDir, n));
}

/** Returns { published, withdrawn, meetingsPublished, meetingsWithdrawn, rejected: [{ file, reason }] }. */
export function processIncoming({ incomingDir, issuesDir, rejectedDir, meetingsDir = null }) {
  const out = { published: [], withdrawn: [], meetingsPublished: [], meetingsWithdrawn: [], indexChanged: false, rejected: [] };
  const issueIndexPath = join(issuesDir, 'index.json');
  const readIssueIndex = () => {
    const i = existsSync(issueIndexPath) ? readJson(issueIndexPath) : {};
    return { ...i, issues: i.issues ?? [], aliases: i.aliases ?? {}, defaultFollows: i.defaultFollows ?? [] };
  };

  // Issues: publish or update.
  for (const name of sweep(incomingDir, '.json').filter(n => n !== INDEX_CHANGES)) {
    const from = join(incomingDir, name);
    try {
      const out1 = buildPublishedIssue(readJson(from));
      if (`${out1.slug}.json` !== name) throw new Error(`the file is named ${name} but its slug is "${out1.slug}"`);
      writeJson(join(issuesDir, name), out1);
      const idx = readIssueIndex();
      if (!idx.issues.includes(name)) idx.issues = [...idx.issues, name];
      writeJson(issueIndexPath, idx);
      rmSync(from);
      clearRejection(rejectedDir, name.replace(/\.json$/, ''));
      out.published.push(out1.slug);
    } catch (e) {
      reject(from, rejectedDir, name, e.message);
      out.rejected.push({ file: name, reason: e.message });
    }
  }

  // Issues: withdraw.
  for (const name of sweep(incomingDir, '.withdraw')) {
    const from = join(incomingDir, name);
    const slug = name.replace(/\.withdraw$/, '');
    try {
      const idx = readIssueIndex();
      if (!idx.issues.includes(`${slug}.json`)) throw new Error(`${slug} is not published, so there is nothing to withdraw`);
      const aliases = Object.fromEntries(Object.entries(idx.aliases).filter(([from, to]) => from !== slug && to !== slug));
      writeJson(issueIndexPath, { ...idx, issues: idx.issues.filter(n => n !== `${slug}.json`), aliases, defaultFollows: idx.defaultFollows.filter(s => s !== slug) });
      rmSync(join(issuesDir, `${slug}.json`), { force: true });
      rmSync(from);
      clearRejection(rejectedDir, slug);
      out.withdrawn.push(slug);
    } catch (e) {
      reject(from, rejectedDir, name, e.message);
      out.rejected.push({ file: name, reason: e.message });
    }
  }

  // Index changes: merges (aliases) and the default follows. Runs after publish/withdraw so one push can do both.
  if (existsSync(join(incomingDir, INDEX_CHANGES))) {
    const from = join(incomingDir, INDEX_CHANGES);
    try {
      const ch = readJson(from);
      const idx = readIssueIndex();
      const published = new Set(idx.issues.map(n => n.replace(/\.json$/, '')));
      const aliases = { ...idx.aliases };
      const known = new Set(['merge', 'unmerge', 'defaultFollows']);
      for (const k of Object.keys(ch)) if (!known.has(k)) throw new Error(`unknown field "${k}" (allowed: merge, unmerge, defaultFollows)`);
      for (const old of ch.unmerge ?? []) {
        if (!(old in aliases)) throw new Error(`"${old}" is not a merged address, so there is nothing to unmerge`);
        delete aliases[old];
      }
      for (const [old, to] of Object.entries(ch.merge ?? {})) {
        if (!SLUG.test(old) || !SLUG.test(to)) throw new Error(`merge ${old} -> ${to}: slugs must be lowercase letters, numbers and hyphens`);
        if (old === to) throw new Error(`merge ${old}: cannot merge an issue into itself`);
        if (published.has(old)) throw new Error(`merge ${old} -> ${to}: "${old}" is still published. Withdraw it first (or in the same push), then merge.`);
        if (!published.has(to)) throw new Error(`merge ${old} -> ${to}: "${to}" is not a published issue`);
        aliases[old] = to;
      }
      for (const [old, to] of Object.entries(aliases)) if (aliases[to] || !published.has(to)) throw new Error(`merge ${old} -> ${to}: must point at a published issue, not at another merge`);
      let defaultFollows = idx.defaultFollows;
      if (ch.defaultFollows !== undefined) {
        if (!Array.isArray(ch.defaultFollows) || ch.defaultFollows.length > 5) throw new Error('defaultFollows must be a list of at most 5 slugs');
        if (new Set(ch.defaultFollows).size !== ch.defaultFollows.length) throw new Error('defaultFollows has a duplicate');
        for (const slug of ch.defaultFollows) if (!published.has(slug)) throw new Error(`defaultFollows: "${slug}" is not a published issue`);
        defaultFollows = ch.defaultFollows;
      }
      writeJson(issueIndexPath, { ...idx, aliases, defaultFollows });
      rmSync(from);
      clearRejection(rejectedDir, 'index-changes');
      out.indexChanged = true;
    } catch (e) {
      reject(from, rejectedDir, INDEX_CHANGES, e.message);
      out.rejected.push({ file: INDEX_CHANGES, reason: e.message });
    }
  }

  // Meetings: publish, update or withdraw (only when a meetings folder is configured).
  if (meetingsDir) {
    const inDir = join(incomingDir, 'meetings');
    const rejDir = join(rejectedDir, 'meetings');
    const indexPath = join(meetingsDir, 'index.json');
    const readNames = () => (existsSync(indexPath) ? readJson(indexPath).meetings ?? [] : []);
    const writeNames = names => writeJson(indexPath, { meetings: names });
    for (const name of sweep(inDir, '.json')) {
      const from = join(inDir, name);
      try {
        const file = readJson(from);
        const pub = buildPublishedMeeting(file, { reviewed: true }); // the producer approved it in Pipeline
        const id = pub.meeting.id;
        if (!YOUTUBE_ID.test(id)) throw new Error(`the meeting id "${id}" is not a real YouTube video id (11 characters). Recordings that are not on YouTube yet must not be published.`);
        if (`${id}.json` !== name) throw new Error(`the file is named ${name} but its meeting id is "${id}"`);
        const hit = meetingElectionHit(pub);
        if (hit) throw new Error(`the recap contains campaign wording ("${hit}"). The producer's hold on campaigning applies until the producer says ready.`);
        mkdirSync(meetingsDir, { recursive: true });
        writeJson(join(meetingsDir, name), pub);
        const names = readNames();
        if (!names.includes(name)) writeNames([name, ...names]);
        rmSync(from);
        clearRejection(rejDir, id);
        out.meetingsPublished.push(id);
      } catch (e) {
        reject(from, rejDir, name, e.message);
        out.rejected.push({ file: `meetings/${name}`, reason: e.message });
      }
    }
    for (const name of sweep(inDir, '.withdraw')) {
      const from = join(inDir, name);
      const id = name.replace(/\.withdraw$/, '');
      try {
        const names = readNames();
        if (!names.includes(`${id}.json`)) throw new Error(`${id} is not published, so there is nothing to withdraw`);
        writeNames(names.filter(n => n !== `${id}.json`));
        rmSync(join(meetingsDir, `${id}.json`), { force: true });
        rmSync(from);
        clearRejection(rejDir, id);
        out.meetingsWithdrawn.push(id);
      } catch (e) {
        reject(from, rejDir, name, e.message);
        out.rejected.push({ file: `meetings/${name}`, reason: e.message });
      }
    }
  }

  if (out.published.length || out.withdrawn.length || out.indexChanged) refreshFeed(issuesDir);
  if (meetingsDir && (out.meetingsPublished.length || out.meetingsWithdrawn.length)) refreshMeetingsFeed(meetingsDir);
  return out;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const r = processIncoming({
    incomingDir: process.env.INCOMING_DIR || join(here, 'incoming'),
    issuesDir: process.env.CONTENT_DIR || join(here, 'issues'),
    rejectedDir: process.env.REJECTED_DIR || join(here, 'rejected'),
    meetingsDir: process.env.MEETINGS_DIR || join(here, 'meetings'),
  });
  const list = a => a.join(', ') || 'none';
  console.log(`Issues published ${r.published.length}: ${list(r.published)}.`);
  console.log(`Issues withdrawn ${r.withdrawn.length}: ${list(r.withdrawn)}.`);
  console.log(`Merges / default follows changed: ${r.indexChanged ? 'yes' : 'no'}.`);
  console.log(`Meetings published ${r.meetingsPublished.length}: ${list(r.meetingsPublished)}.`);
  console.log(`Meetings withdrawn ${r.meetingsWithdrawn.length}: ${list(r.meetingsWithdrawn)}.`);
  for (const x of r.rejected) console.log(`REJECTED ${x.file}: ${x.reason}`);
  process.exitCode = r.rejected.length ? 2 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
