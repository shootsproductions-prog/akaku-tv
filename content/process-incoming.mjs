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
// Every file goes through the same checks as `publish-issue.mjs` / `publish-meeting.mjs`, including the producer's
// election hold. Good files leave incoming/. A file that fails a check is moved to content/rejected/ (meetings:
// content/rejected/meetings/) with <name>.reason.txt saying why, and nothing about it goes live.
// Run by .github/workflows/publish-incoming.yml whenever Pipeline pushes to content/incoming/.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { refreshFeed } from './feed.mjs';
import { buildPublishedIssue, ELECTION } from './publish-issue.mjs';
import { buildPublished as buildPublishedMeeting } from './publish-meeting.mjs';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

/** The same election hold for a recap, which has no fixed text fields: look at every string in it. */
function meetingElectionHit(value) {
  const hits = [];
  const walk = v => {
    if (typeof v === 'string') { const m = ELECTION.exec(v); if (m) hits.push(m[0]); }
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
  const out = { published: [], withdrawn: [], meetingsPublished: [], meetingsWithdrawn: [], rejected: [] };
  const issueIndexPath = join(issuesDir, 'index.json');
  const readIssueIndex = () => {
    const i = existsSync(issueIndexPath) ? readJson(issueIndexPath) : {};
    return { ...i, issues: i.issues ?? [], aliases: i.aliases ?? {}, defaultFollows: i.defaultFollows ?? [] };
  };

  // Issues: publish or update.
  for (const name of sweep(incomingDir, '.json')) {
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
        if (hit) throw new Error(`the recap mentions an election, ballot, voter or campaign ("${hit}"). The producer's hold applies: nothing about elections is published until the producer says ready.`);
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

  if (out.published.length || out.withdrawn.length) refreshFeed(issuesDir);
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
  console.log(`Meetings published ${r.meetingsPublished.length}: ${list(r.meetingsPublished)}.`);
  console.log(`Meetings withdrawn ${r.meetingsWithdrawn.length}: ${list(r.meetingsWithdrawn)}.`);
  for (const x of r.rejected) console.log(`REJECTED ${x.file}: ${x.reason}`);
  process.exitCode = r.rejected.length ? 2 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
