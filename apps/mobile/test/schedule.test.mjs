import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSchedule, nowNext } from '../src/data/schedule.ts';

// Shape copied from https://www.akaku.org/?rest_route=/akaku/v1/now
const raw = { generated: 1791348359, channels: {
  53: {
    now: { title: 'Urban Design Review Board', live: false, start: 1791341710, end: 1791349165 },
    next: [
      { title: 'South Maui Plan', live: false, start: 1791356400, at: '9:00 PM' },
      { title: 'MPO TAC', live: false, start: 1791352800, at: '8:00 PM' },
      { live: false, start: 1 },
    ],
    thumb: { url: 'https://www.akaku.org/wp-content/uploads/akaku-live/ch53.jpg?v=1', updated: 1 },
  },
  54: { now: null, next: [], thumb: { url: 'http://insecure/x.jpg' } },
  junk: 1,
} };

test('parses the live feed shape', () => {
  const s = parseSchedule(raw);
  assert.deepEqual(Object.keys(s), ['53', '54']);
  assert.deepEqual(s[53].next.map(p => p.title), ['MPO TAC', 'South Maui Plan']);
  assert.equal(s[53].now.start, 1791341710000);
  assert.equal(s[54].thumb, null);
  assert.deepEqual(parseSchedule(null), {});
});

test('now, next and progress', () => {
  const s = parseSchedule(raw);
  const mid = (1791341710 + 1791349165) / 2 * 1000;
  const r = nowNext(s[53], mid);
  assert.equal(r.now.title, 'Urban Design Review Board');
  assert.equal(r.next.title, 'MPO TAC');
  assert.ok(Math.abs(r.progress - 0.5) < 0.001);
  const after = nowNext(s[53], 1791350000 * 1000);
  assert.equal(after.now, null);
  assert.equal(after.next.title, 'MPO TAC');
  assert.equal(nowNext(undefined, 0).next, null);
});
