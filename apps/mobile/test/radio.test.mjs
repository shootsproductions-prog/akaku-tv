import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseRadioSchedule, radioNowNext } from '../src/data/radio.ts';

test('reads a list or { shows }, seconds or ISO, drops bad rows, sorts', () => {
  const rows = [
    { title: ' Evening Show ', host: ' DJ A ', start: '2026-10-09T05:00:00Z', end: '2026-10-09T06:00:00Z' },
    { title: 'Morning Show', start: 1791316800, end: 1791320400 },
    { title: '', start: 1, end: 2 },
    { title: 'Backwards', start: 10, end: 5 },
    { title: 'No times' },
  ];
  const a = parseRadioSchedule(rows);
  assert.deepEqual(a.map(s => s.title), ['Morning Show', 'Evening Show']);
  assert.equal(a[1].host, 'DJ A');
  assert.equal(a[0].host, null);
  assert.equal(a[0].start, 1791316800 * 1000);
  assert.deepEqual(parseRadioSchedule({ shows: rows }).length, 2);
  assert.deepEqual(parseRadioSchedule(null), []);
});

test('on air now and what is coming up', () => {
  const shows = parseRadioSchedule([
    { title: 'A', start: 1000, end: 2000 },
    { title: 'B', start: 2000, end: 3000 },
    { title: 'C', start: 3000, end: 4000 },
  ]);
  const r = radioNowNext(shows, 2500 * 1000);
  assert.equal(r.now.title, 'B');
  assert.deepEqual(r.upcoming.map(s => s.title), ['C']);
  assert.equal(radioNowNext(shows, 9000 * 1000).now, null);
});

test('reads the akaku.org { ready, now, next } shape', () => {
  const raw = {
    ready: true,
    now: { title: 'A', desc: ' One line. ', start: 1000, end: 2000, replay: false },
    next: [{ title: 'B', desc: '', start: 2000, end: 3000, replay: true }],
  };
  const a = parseRadioSchedule(raw);
  assert.deepEqual(a.map(s => s.title), ['A', 'B']);
  assert.equal(a[0].desc, 'One line.');
  assert.equal(a[1].replay, true);
  assert.equal(a[1].desc, null);
  assert.deepEqual(parseRadioSchedule({ ready: false, now: raw.now, next: raw.next }), []);
  assert.deepEqual(parseRadioSchedule({ ready: true, now: null, next: [] }), []);
});
