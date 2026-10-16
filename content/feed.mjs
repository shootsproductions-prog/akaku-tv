// Keeps the published feed's bookkeeping current, so readers (akaku.org/track and the app) fetch only what changed.
//
//   content/issues/index.json    gains  updatedAt, etag, files: { "<slug>.json": { updatedAt, sha256 } }
//   content/issues/catalog.json  every listed issue in one file: { updatedAt, count, issues: [ ... ] }
//   content/issues/meta.json     { contract, version, updatedAt, issueCount } for a quick "anything new?" check
//
// A file's updatedAt moves only when its content changes (its sha256 differs from last time). The feed's
// updatedAt moves when any file, the list of files, the aliases or the default follows change.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const sha256 = text => createHash('sha256').update(text).digest('hex');

/** Rewrites index.json's bookkeeping, catalog.json and meta.json from the issue files index.json lists. */
export function refreshFeed(issuesDir, now = process.env.FEED_NOW || new Date().toISOString()) {
  const indexPath = join(issuesDir, 'index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  const before = index.files ?? {};
  const files = {};
  const issues = [];
  for (const name of index.issues ?? []) {
    const p = join(issuesDir, name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8');
    const hash = sha256(text);
    files[name] = { updatedAt: before[name]?.sha256 === hash ? before[name].updatedAt : now, sha256: hash };
    issues.push(JSON.parse(text));
  }
  // etag: changes when any file, the list, the aliases or the default follows change.
  const etag = sha256(JSON.stringify([Object.entries(files).map(([n, f]) => [n, f.sha256]), index.aliases ?? {}, index.defaultFollows ?? []]));
  const updatedAt = index.updatedAt && index.etag === etag ? index.updatedAt : now;
  const next = { ...index, updatedAt, etag, files };
  writeFileSync(indexPath, JSON.stringify(next, null, 2) + '\n');
  writeFileSync(join(issuesDir, 'catalog.json'), JSON.stringify({ updatedAt, count: issues.length, issues }, null, 2) + '\n');
  writeFileSync(join(issuesDir, 'meta.json'), JSON.stringify({ contract: 'issues-catalog', version: '0.2', updatedAt, issueCount: issues.length }, null, 2) + '\n');
  return next;
}
