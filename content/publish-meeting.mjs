#!/usr/bin/env node
// Publish a reviewed County Watch recap to the app.
//
//   node content/publish-meeting.mjs path/to/<videoId>.json
//
// Copies the file into content/meetings/ and adds it to index.json. Commit and
// merge the result to the default branch; the app picks it up on next launch.
// Use --remove <videoId> to unpublish.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'meetings');
const indexPath = join(dir, 'index.json');
const readIndex = () => JSON.parse(readFileSync(indexPath, 'utf8'));
const writeIndex = names => writeFileSync(indexPath, JSON.stringify({ meetings: names }, null, 2) + '\n');
const fail = msg => { console.error(`Error: ${msg}`); process.exit(1); };

const args = process.argv.slice(2);
if (args[0] === '--remove') {
  const id = args[1] ?? fail('usage: --remove <videoId>');
  const name = `${id}.json`;
  const names = readIndex().meetings;
  if (!names.includes(name)) fail(`${name} is not published`);
  writeIndex(names.filter(n => n !== name));
  console.log(`Unpublished ${name}. (The file stays in content/meetings/ until you delete it.)`);
  process.exit(0);
}

const src = args[0] ?? fail('usage: node content/publish-meeting.mjs <recap.json>');
const file = JSON.parse(readFileSync(src, 'utf8'));
const m = file.meeting;
if (!m?.id || !/^[A-Za-z0-9_-]+$/.test(m.id)) fail('recap has no usable meeting.id');
for (const k of ['body', 'date', 'recap']) if (typeof m[k] !== 'string' || !m[k]) fail(`meeting.${k} is missing`);
if (/draft/i.test(String(file.status ?? '')) && !args.includes('--reviewed')) {
  fail(`status is "${file.status}". Review the recap, then re-run with --reviewed to confirm a person checked it.`);
}

const name = `${m.id}.json`;
writeFileSync(join(dir, name), JSON.stringify(file, null, 2) + '\n');
const names = readIndex().meetings;
writeIndex(names.includes(name) ? names : [name, ...names]);
console.log(`Published ${name} (${m.body}, ${m.date}).`);
