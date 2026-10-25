import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { refreshFeed, refreshMeetingsFeed } from '../../../content/feed.mjs';
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

test('meetings catalog: one small entry per meeting, newest first, stable updatedAt', () => {
  const d = mkdtempSync(join(tmpdir(), 'mcat-'));
  const meeting = (id, date, extra = {}) => ({ videoId: id, status: 'reviewed', meetingDateISO: date, headline: `H ${id}`, meeting: { id, body: 'Board', summary: `S ${id}`, dur: '30 m', votes: [{}, {}], moments: [{}], bodyType: 'board', trackerIssues: [{ slug: 'a-b', title: 'AB' }], ...extra } });
  writeFileSync(join(d, 'A1.json'), JSON.stringify(meeting('A1', '2026-10-01')));
  writeFileSync(join(d, 'B2.json'), JSON.stringify(meeting('B2', '2026-10-09', { bodyType: 'weird' })));
  writeFileSync(join(d, 'index.json'), JSON.stringify({ meetings: ['A1.json', 'B2.json', 'gone.json'] }));
  const r1 = refreshMeetingsFeed(d, '2026-10-25T00:00:00.000Z');
  const c1 = read(d, 'catalog.json');
  assert.equal(r1.count, 2);
  assert.deepEqual(c1.meetings.map(m => m.videoId), ['B2', 'A1']);
  assert.deepEqual(c1.meetings[1], { videoId: 'A1', status: 'reviewed', meetingDateISO: '2026-10-01', bodyType: 'board', body: 'Board', headline: 'H A1', summary: 'S A1', dur: '30 m', voteCount: 2, momentCount: 1, issues: ['a-b'], updatedAt: '2026-10-25T00:00:00.000Z', sha256: c1.meetings[1].sha256 });
  assert.equal('bodyType' in c1.meetings[0], false);
  // Unchanged files keep their updatedAt; a changed one moves only itself.
  refreshMeetingsFeed(d, '2026-10-26T00:00:00.000Z');
  assert.equal(read(d, 'catalog.json').updatedAt, '2026-10-25T00:00:00.000Z');
  writeFileSync(join(d, 'A1.json'), JSON.stringify(meeting('A1', '2026-10-01', { summary: 'new' })));
  refreshMeetingsFeed(d, '2026-10-27T00:00:00.000Z');
  const c3 = read(d, 'catalog.json');
  assert.equal(c3.updatedAt, '2026-10-27T00:00:00.000Z');
  assert.equal(c3.meetings.find(m => m.videoId === 'A1').updatedAt, '2026-10-27T00:00:00.000Z');
  assert.equal(c3.meetings.find(m => m.videoId === 'B2').updatedAt, '2026-10-25T00:00:00.000Z');
});
