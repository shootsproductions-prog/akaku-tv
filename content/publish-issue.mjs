#!/usr/bin/env node
// Publish an approved Issues-catalog file to the app (contract `issues-catalog` on the board).
//
//   node content/publish-issue.mjs path/to/<slug>.json
//   node content/publish-issue.mjs --remove <slug>
//   node content/publish-issue.mjs --alias <old-slug>=<new-slug>      (record a merge)
//   node content/publish-issue.mjs --default-follow <slug> [--default-follow <slug2>]   (replace the list)
//
// Copies ONLY the app-facing fields into content/issues/ and lists the file in
// index.json, which also carries `aliases` and `defaultFollows`. Proposed
// issues are refused: they never leave Pipeline. Commit and merge the result.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}/;
const STATUSES = ['active', 'quiet', 'resolved'];
const BASES = ['said-at-meeting', 'confirmed', 'conflicting'];
const SOURCE_TYPES = ['meeting', 'county-release', 'county-page', 'other'];

const nonEmpty = v => typeof v === 'string' && v.trim().length > 0;
const count = v => Number.isInteger(v) && v >= 0;

function checkSource(s, where) {
  if (!s || typeof s !== 'object') throw new Error(`${where}: source is missing`);
  if (!SOURCE_TYPES.includes(s.type)) throw new Error(`${where}: source.type must be one of ${SOURCE_TYPES.join(', ')}`);
  if (!nonEmpty(s.retrievedISO)) throw new Error(`${where}: source.retrievedISO is missing`);
  if (s.type === 'meeting') {
    if (!nonEmpty(s.videoId) || !/^[A-Za-z0-9_-]+$/.test(s.videoId)) throw new Error(`${where}: a meeting source needs a videoId`);
    if (!nonEmpty(s.ts) || !/^\d{1,2}(:\d{2}){1,2}$/.test(s.ts)) throw new Error(`${where}: a meeting source needs a proof timestamp like 1:02:33`);
    return { type: 'meeting', videoId: s.videoId, ts: s.ts, retrievedISO: s.retrievedISO };
  }
  if (!nonEmpty(s.url) || !s.url.startsWith('https://')) throw new Error(`${where}: a ${s.type} source needs an https url`);
  if (!nonEmpty(s.publisher)) throw new Error(`${where}: a ${s.type} source needs a publisher`);
  if (!nonEmpty(s.quote)) throw new Error(`${where}: a ${s.type} source needs the quote the fact rests on`);
  return { type: s.type, url: s.url, publisher: s.publisher, quote: s.quote, retrievedISO: s.retrievedISO };
}

/** Validate an issue file and return the app-facing copy. Throws a plain-English Error if it must not be published. */
export function buildPublishedIssue(file) {
  if (!file || typeof file !== 'object') throw new Error('the file is not an issue');
  if (!nonEmpty(file.slug) || !SLUG.test(file.slug)) throw new Error('slug must be lowercase words joined by hyphens, like "kula-water-meters"');
  if (file.status === 'proposed') throw new Error('this issue is still "proposed". Proposed issues never leave Pipeline; the producer must approve it first.');
  if (!STATUSES.includes(file.status)) throw new Error(`status must be one of ${STATUSES.join(', ')}`);
  for (const k of ['title', 'summary']) if (!nonEmpty(file[k])) throw new Error(`${k} is missing`);
  if (!nonEmpty(file.disclaimer)) throw new Error('the disclaimer is missing. Every issue must carry "Summarized by Akakū Intelligence. It can make mistakes."');
  if (!Array.isArray(file.topics) || !file.topics.length || !file.topics.every(nonEmpty)) throw new Error('topics must be a list with at least one topic');
  for (const k of ['firstSeenISO', 'lastSeenISO']) if (!nonEmpty(file[k]) || !DATE.test(file[k])) throw new Error(`${k} must be a date like 2026-10-06`);

  const sig = file.signals;
  if (!sig || !['meetingsLast30d', 'meetingsLast90d', 'mentionsLast30d'].every(k => count(sig[k]))) {
    throw new Error('signals needs whole-number counts: meetingsLast30d, meetingsLast90d, mentionsLast30d');
  }
  let upcomingEvent = null;
  if (sig.upcomingEvent != null) {
    const ev = sig.upcomingEvent;
    if (!nonEmpty(ev.dateISO) || !nonEmpty(ev.what)) throw new Error('signals.upcomingEvent needs dateISO and what');
    upcomingEvent = { dateISO: ev.dateISO, what: ev.what, source: checkSource(ev.source, 'signals.upcomingEvent') };
  }

  if (!Array.isArray(file.timeline)) throw new Error('timeline must be a list (it can be empty)');
  const timeline = file.timeline.map((e, i) => {
    const where = `timeline[${i}]`;
    if (!nonEmpty(e?.text)) throw new Error(`${where}: text is missing`);
    if (!nonEmpty(e.dateISO) || !DATE.test(e.dateISO)) throw new Error(`${where}: dateISO must be a date`);
    if (!BASES.includes(e.basis)) throw new Error(`${where}: basis must be one of ${BASES.join(', ')}`);
    const out = { dateISO: e.dateISO, text: e.text, basis: e.basis, source: checkSource(e.source, where) };
    if (nonEmpty(e.body)) out.body = e.body;
    if (e.basis === 'conflicting') {
      if (!nonEmpty(e.conflictGroup)) throw new Error(`${where}: a conflicting entry needs a conflictGroup shared with the entry it disagrees with`);
      out.conflictGroup = e.conflictGroup;
    }
    return out;
  });
  for (const g of new Set(timeline.filter(e => e.conflictGroup).map(e => e.conflictGroup))) {
    if (timeline.filter(e => e.conflictGroup === g).length < 2) throw new Error(`conflictGroup "${g}" has only one entry; a conflict needs both sides`);
  }

  return {
    slug: file.slug,
    title: file.title,
    summary: file.summary,
    topics: file.topics,
    status: file.status,
    pinned: file.pinned === true,
    firstSeenISO: file.firstSeenISO,
    lastSeenISO: file.lastSeenISO,
    signals: { meetingsLast30d: sig.meetingsLast30d, meetingsLast90d: sig.meetingsLast90d, mentionsLast30d: sig.mentionsLast30d, upcomingEvent },
    timeline,
    sourceTypes: [...new Set(timeline.map(e => e.source.type))],
    disclaimer: file.disclaimer,
  };
}

function main(args) {
  const dir = process.env.CONTENT_DIR || join(dirname(fileURLToPath(import.meta.url)), 'issues');
  const indexPath = join(dir, 'index.json');
  const fail = msg => {
    console.error(`Error: ${msg}`);
    process.exit(1);
  };
  const readIndex = () => {
    const i = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : {};
    return { issues: i.issues ?? [], aliases: i.aliases ?? {}, defaultFollows: i.defaultFollows ?? [] };
  };
  const writeIndex = i => writeFileSync(indexPath, JSON.stringify(i, null, 2) + '\n');

  const flags = args.filter(a => a.startsWith('--'));
  const takes = flag => args.flatMap((a, n) => (a === flag ? [args[n + 1] ?? fail(`usage: ${flag} <value>`)] : []));

  if (flags.includes('--remove')) {
    const slug = takes('--remove')[0];
    const idx = readIndex();
    const name = `${slug}.json`;
    if (!idx.issues.includes(name)) fail(`${name} is not published`);
    writeIndex({ ...idx, issues: idx.issues.filter(n => n !== name), defaultFollows: idx.defaultFollows.filter(s => s !== slug) });
    console.log(`Unpublished ${name}. (The file stays in content/issues/ until you delete it. Record a merge with --alias instead if followers should move.)`);
    return;
  }
  if (flags.includes('--alias')) {
    const idx = readIndex();
    for (const pair of takes('--alias')) {
      const [from, to] = pair.split('=');
      if (!SLUG.test(from ?? '') || !SLUG.test(to ?? '') || from === to) fail(`--alias needs old-slug=new-slug, got "${pair}"`);
      if (!idx.issues.includes(`${to}.json`)) fail(`${to} is not published, so nothing can merge into it`);
      idx.aliases[from] = to;
      idx.issues = idx.issues.filter(n => n !== `${from}.json`);
    }
    writeIndex(idx);
    console.log('Recorded the merge. Followers of the old slug now follow the new one.');
    return;
  }
  if (flags.includes('--default-follow')) {
    const idx = readIndex();
    const slugs = takes('--default-follow');
    for (const s of slugs) if (!idx.issues.includes(`${s}.json`)) fail(`${s} is not published, so it cannot be a default follow`);
    writeIndex({ ...idx, defaultFollows: slugs });
    console.log(`New users will start out following: ${slugs.join(', ')}.`);
    return;
  }

  const src = args.find(a => !a.startsWith('--')) ?? fail('usage: node content/publish-issue.mjs <issue.json>');
  let file;
  try {
    file = JSON.parse(readFileSync(src, 'utf8'));
  } catch (e) {
    fail(`could not read ${src}: ${e.message}`);
  }
  let out;
  try {
    out = buildPublishedIssue(file);
  } catch (e) {
    fail(e.message);
  }
  const name = `${out.slug}.json`;
  writeFileSync(join(dir, name), JSON.stringify(out, null, 2) + '\n');
  const idx = readIndex();
  if (!idx.issues.includes(name)) idx.issues = [...idx.issues, name];
  writeIndex(idx);
  console.log(`Published ${name} (${out.title}) as "${out.status}" with ${out.timeline.length} timeline entries.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
