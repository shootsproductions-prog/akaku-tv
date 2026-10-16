import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { refreshFeed } from '../../../content/feed.mjs';
import { parseIndex } from '../src/data/catalog.ts';

const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/example-issue.publish.json', import.meta.url)), 'utf8'));
const read = (dir, name) => JSON.parse(readFileSync(join(dir, name), 'utf8'));

function dir() {
  const d = mkdtempSync(join(tmpdir(), 'feed-'));
  const put = (slug, over = {}) => writeFileSync(join(d, `${slug}.json`), JSON.stringify({ ...fixture, slug, ...over }));
  const list = (issues, extra = {}) => writeFileSync(join(d, 'index.json'), JSON.stringify({ issues, aliases: {}, defaultFollows: [], ...extra }));
  return { d, put, list };
}

test('adds per-file updatedAt and sha256, a combined catalog and meta', () => {
  const { d, put, list } = dir();
  put('a');
  put('b');
  list(['a.json', 'b.json']);
  refreshFeed(d, '2026-10-16T10:00:00.000Z');
  const idx = read(d, 'index.json');
  assert.equal(idx.updatedAt, '2026-10-16T10:00:00.000Z');
  assert.deepEqual(Object.keys(idx.files), ['a.json', 'b.json']);
  assert.match(idx.files['a.json'].sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(read(d, 'catalog.json').issues.map(i => i.slug), ['a', 'b']);
  assert.equal(read(d, 'catalog.json').count, 2);
  assert.deepEqual(read(d, 'meta.json'), { contract: 'issues-catalog', version: '0.2', updatedAt: '2026-10-16T10:00:00.000Z', issueCount: 2 });
});

test('only changed files move; nothing changed means nothing moves', () => {
  const { d, put, list } = dir();
  put('a');
  put('b');
  list(['a.json', 'b.json']);
  refreshFeed(d, '2026-10-16T10:00:00.000Z');
  refreshFeed(d, '2026-10-17T10:00:00.000Z');
  assert.equal(read(d, 'index.json').updatedAt, '2026-10-16T10:00:00.000Z');
  put('b', { title: 'Changed title' });
  refreshFeed(d, '2026-10-18T10:00:00.000Z');
  const idx = read(d, 'index.json');
  assert.equal(idx.files['a.json'].updatedAt, '2026-10-16T10:00:00.000Z');
  assert.equal(idx.files['b.json'].updatedAt, '2026-10-18T10:00:00.000Z');
  assert.equal(idx.updatedAt, '2026-10-18T10:00:00.000Z');
});

test('removing an issue drops it from files and catalog; default follows count as a change; the app still reads the index', () => {
  const { d, put, list } = dir();
  put('a');
  put('b');
  list(['a.json', 'b.json']);
  refreshFeed(d, '2026-10-16T10:00:00.000Z');
  list(['a.json'], { files: read(d, 'index.json').files, updatedAt: '2026-10-16T10:00:00.000Z' });
  refreshFeed(d, '2026-10-19T10:00:00.000Z');
  const idx = read(d, 'index.json');
  assert.deepEqual(Object.keys(idx.files), ['a.json']);
  assert.deepEqual(read(d, 'catalog.json').issues.map(i => i.slug), ['a']);
  assert.equal(idx.updatedAt, '2026-10-19T10:00:00.000Z');
  list(['a.json'], { files: idx.files, updatedAt: idx.updatedAt, defaultFollows: ['a'] });
  refreshFeed(d, '2026-10-20T10:00:00.000Z');
  assert.equal(read(d, 'index.json').updatedAt, '2026-10-20T10:00:00.000Z');
  assert.deepEqual(parseIndex(read(d, 'index.json')).issues, ['a.json']);
});
