import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSchedule, nowNext } from '../src/data/schedule.ts';

const raw = { 53: [
  { start: '2026-10-07T20:00:00Z', end: '2026-10-07T21:00:00Z', title: 'B' },
  { start: '2026-10-07T19:00:00Z', end: '2026-10-07T20:00:00Z', title: 'A' },
  { start: 'nope', end: 'x', title: 'bad' },
], junk: 1 };

test('parses, sorts and drops bad rows', () => {
  const s = parseSchedule(raw);
  assert.deepEqual(s[53].map(p => p.title), ['A', 'B']);
  assert.equal(Object.keys(s).length, 1);
});

test('now, next and progress', () => {
  const s = parseSchedule(raw);
  const r = nowNext(s[53], Date.parse('2026-10-07T19:30:00Z'));
  assert.equal(r.now?.title, 'A');
  assert.equal(r.next?.title, 'B');
  assert.equal(r.progress, 0.5);
  assert.equal(nowNext(s[53], Date.parse('2026-10-07T22:00:00Z')).now, null);
  assert.equal(nowNext(undefined, 0).next, null);
});
