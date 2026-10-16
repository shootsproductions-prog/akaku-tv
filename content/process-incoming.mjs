#!/usr/bin/env node
// Publish every issue file Pipeline has dropped into content/incoming/.
//
//   node content/process-incoming.mjs
//
// Pipeline writes an approved issue (its own format) to content/incoming/<slug>.json. This does exactly what
// `publish-issue.mjs` does by hand: it runs the same checks (including the producer's election hold), writes the
// app-facing copy to content/issues/, and lists it in index.json. Good files leave incoming/. A file that fails a
// check is moved to content/rejected/<slug>.json with <slug>.reason.txt saying why, and nothing about it goes live.
// Run by .github/workflows/publish-incoming.yml whenever Pipeline pushes to content/incoming/.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { refreshFeed } from './feed.mjs';
import { buildPublishedIssue } from './publish-issue.mjs';

/** Returns { published: [slug], rejected: [{ file, reason }] }. */
export function processIncoming({ incomingDir, issuesDir, rejectedDir }) {
  mkdirSync(rejectedDir, { recursive: true });
  const indexPath = join(issuesDir, 'index.json');
  const readIndex = () => {
    const i = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : {};
    return { issues: i.issues ?? [], aliases: i.aliases ?? {}, defaultFollows: i.defaultFollows ?? [] };
  };
  const files = existsSync(incomingDir) ? readdirSync(incomingDir).filter(n => n.endsWith('.json')).sort() : [];
  const published = [];
  const rejected = [];
  for (const name of files) {
    const from = join(incomingDir, name);
    try {
      const file = JSON.parse(readFileSync(from, 'utf8'));
      const out = buildPublishedIssue(file);
      if (`${out.slug}.json` !== name) throw new Error(`the file is named ${name} but its slug is "${out.slug}"`);
      writeFileSync(join(issuesDir, name), JSON.stringify(out, null, 2) + '\n');
      const idx = readIndex();
      if (!idx.issues.includes(name)) idx.issues = [...idx.issues, name];
      writeFileSync(indexPath, JSON.stringify(idx, null, 2) + '\n');
      rmSync(from);
      rejectedCleanup(rejectedDir, name);
      published.push(out.slug);
    } catch (e) {
      renameSync(from, join(rejectedDir, name));
      writeFileSync(join(rejectedDir, name.replace(/\.json$/, '.reason.txt')), `${e.message}\n`);
      rejected.push({ file: name, reason: e.message });
    }
  }
  if (published.length) refreshFeed(issuesDir);
  return { published, rejected };
}

/** A file that now passes no longer needs an old rejection record. */
function rejectedCleanup(rejectedDir, name) {
  for (const n of [name, name.replace(/\.json$/, '.reason.txt')]) if (existsSync(join(rejectedDir, n))) rmSync(join(rejectedDir, n));
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const r = processIncoming({
    incomingDir: process.env.INCOMING_DIR || join(here, 'incoming'),
    issuesDir: process.env.CONTENT_DIR || join(here, 'issues'),
    rejectedDir: process.env.REJECTED_DIR || join(here, 'rejected'),
  });
  console.log(`Published ${r.published.length}: ${r.published.join(', ') || 'none'}.`);
  for (const x of r.rejected) console.log(`REJECTED ${x.file}: ${x.reason}`);
  process.exitCode = r.rejected.length ? 2 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
