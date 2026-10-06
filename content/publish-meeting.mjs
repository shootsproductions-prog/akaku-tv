#!/usr/bin/env node
// Publish a County Watch recap to the app.
//
//   node content/publish-meeting.mjs path/to/<videoId>.publish.json
//   node content/publish-meeting.mjs path/to/<videoId>.json --reviewed     (a full review draft)
//   node content/publish-meeting.mjs --remove <videoId>
//
// Copies ONLY the app-facing fields into content/meetings/ and lists the file
// in index.json. Internal review data (review_flags, verification, claims,
// run costs, summarySource, most of source) is never copied. Commit and merge
// the result to the default branch; the app picks it up on next launch.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Keep in sync with ISSUE_LABELS in apps/mobile/src/data/issues.ts.
export const ISSUE_LABELS = ['Water', 'Housing', 'Food Security', 'Disaster Recovery'];

const nonEmpty = v => typeof v === 'string' && v.trim().length > 0;

/**
 * Validate a recap file and return the app-facing copy.
 * Throws an Error with a plain-English message if the file must not be published.
 */
export function buildPublished(file, { reviewed = false } = {}) {
  const m = file?.meeting;
  if (!m || typeof m !== 'object') throw new Error('recap has no meeting section');
  if (!nonEmpty(m.id) || !/^[A-Za-z0-9_-]+$/.test(m.id)) throw new Error('recap has no usable meeting.id');
  for (const k of ['body', 'date', 'recap']) if (!nonEmpty(m[k])) throw new Error(`meeting.${k} is missing`);
  if (!nonEmpty(file.disclaimer)) throw new Error('the disclaimer is missing. Every recap must carry "Summarized by Akakū Intelligence. It can make mistakes."');

  const issues = file.issues ?? [];
  if (!Array.isArray(issues)) throw new Error('issues must be a list (it can be empty)');
  for (const is of issues) {
    if (!ISSUE_LABELS.includes(is?.issue)) {
      throw new Error(`an issue is labeled "${is?.issue}". Only ${ISSUE_LABELS.join(', ')} can be published; "other" claims stay in the meeting recap.`);
    }
  }

  let status = typeof file.status === 'string' ? file.status : '';
  if (/draft/i.test(status)) {
    if (!reviewed) throw new Error(`status is "${status}". Review the recap, then re-run with --reviewed to confirm a person checked it.`);
    status = 'reviewed';
  }

  const out = { videoId: nonEmpty(file.videoId) ? file.videoId : m.id, status };
  out.disclaimer = file.disclaimer;
  if (nonEmpty(file.generatedAt)) out.generatedAt = file.generatedAt;
  if (nonEmpty(file.meetingDateISO)) out.meetingDateISO = file.meetingDateISO;
  if (nonEmpty(file.headline)) out.headline = file.headline;
  out.topics = Array.isArray(file.topics) ? file.topics.filter(t => ISSUE_LABELS.includes(t)) : [...new Set(issues.map(i => i.issue))];
  out.meeting = m;
  out.issues = issues;
  if (nonEmpty(file.source?.youtubeUrl)) out.source = { youtubeUrl: file.source.youtubeUrl };
  return out;
}

function main(args) {
  const dir = process.env.CONTENT_DIR || join(dirname(fileURLToPath(import.meta.url)), 'meetings');
  const indexPath = join(dir, 'index.json');
  const readIndex = () => (existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')).meetings : []);
  const writeIndex = names => writeFileSync(indexPath, JSON.stringify({ meetings: names }, null, 2) + '\n');
  const fail = msg => {
    console.error(`Error: ${msg}`);
    process.exit(1);
  };

  if (args[0] === '--remove') {
    const id = args[1] ?? fail('usage: --remove <videoId>');
    const name = `${id}.json`;
    const names = readIndex();
    if (!names.includes(name)) fail(`${name} is not published`);
    writeIndex(names.filter(n => n !== name));
    console.log(`Unpublished ${name}. (The file stays in content/meetings/ until you delete it.)`);
    return;
  }

  const src = args.find(a => !a.startsWith('--')) ?? fail('usage: node content/publish-meeting.mjs <recap.json> [--reviewed]');
  let file;
  try {
    file = JSON.parse(readFileSync(src, 'utf8'));
  } catch (e) {
    fail(`could not read ${src}: ${e.message}`);
  }
  let out;
  try {
    out = buildPublished(file, { reviewed: args.includes('--reviewed') });
  } catch (e) {
    fail(e.message);
  }
  if (!out.meetingDateISO) console.warn('Warning: no meetingDateISO in this file, so it will sort last in the app.');

  const name = `${out.meeting.id}.json`;
  writeFileSync(join(dir, name), JSON.stringify(out, null, 2) + '\n');
  const names = readIndex();
  writeIndex(names.includes(name) ? names : [name, ...names]);
  console.log(`Published ${name} (${out.meeting.body}, ${out.meeting.date}) as "${out.status}".`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
