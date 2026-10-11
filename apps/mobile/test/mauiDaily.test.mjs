import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dayLabel, groupByDay, isCurrent, parseMauiWeek, pickedStories, storyTime, storyUrl } from '../src/data/mauiDaily.ts';

const story = (over = {}) => ({
  id: '261005-01', episodeId: '261005', dateISO: '2026-10-05', headline: 'Storm surges erode Maui beaches', summary: 'A package on managed retreat.',
  topics: ['environment', ' erosion '], kind: 'package', youtubeId: 'lmIj2y1ykes', startSeconds: 96, durationSeconds: 272, picked: true, ...over,
});
const week = (stories, over = {}) => ({ weekStart: '2026-10-05', generatedISO: '2026-10-11T05:03:03.210Z', episodes: [], stories, disclaimer: 'Summarized by Akakū Intelligence. It can make mistakes.', ...over });

test('reads a week, trims text, and drops malformed or repeated stories', () => {
  const w = parseMauiWeek(week([
    story(),
    story({ id: '261005-02', headline: 'State rests case', picked: false, startSeconds: 368.9 }),
    story({ id: '261005-01' }), // repeat id
    story({ id: 'x1', headline: '' }),
    story({ id: 'x2', youtubeId: 'short' }),
    story({ id: 'x3', startSeconds: -5 }),
    story({ id: 'x4', startSeconds: 'soon' }),
    story({ id: 'x5', dateISO: 'Oct 5' }),
    null,
  ]));
  assert.deepEqual(w.stories.map(s => s.id), ['261005-01', '261005-02']);
  assert.deepEqual(w.stories[0].topics, ['environment', 'erosion']);
  assert.equal(w.stories[1].startSeconds, 368);
  assert.equal(w.stories[0].durationSeconds, 272);
});

test('returns null for bad files and uses the standard disclaimer when missing', () => {
  assert.equal(parseMauiWeek(null), null);
  assert.equal(parseMauiWeek({ stories: [] }), null);
  assert.equal(parseMauiWeek(week([story()], { weekStart: 'Monday' })), null);
  assert.equal(parseMauiWeek(week([story({ headline: '' })])), null);
  assert.match(parseMauiWeek(week([story()], { disclaimer: '' })).disclaimer, /can make mistakes/);
});

test('picked stories, grouping by day (newest first, air order inside a day), links and labels', () => {
  const w = parseMauiWeek(week([
    story({ id: 'a-1', dateISO: '2026-10-05', picked: false }),
    story({ id: 'b-1', dateISO: '2026-10-06', picked: true, startSeconds: 3753 }),
    story({ id: 'a-2', dateISO: '2026-10-05', picked: true }),
  ]));
  assert.deepEqual(pickedStories(w).map(s => s.id), ['b-1', 'a-2']);
  const days = groupByDay(w.stories);
  assert.deepEqual(days.map(d => d.dateISO), ['2026-10-06', '2026-10-05']);
  assert.deepEqual(days[1].stories.map(s => s.id), ['a-1', 'a-2']);
  const b = w.stories.find(s => s.id === 'b-1');
  assert.equal(storyUrl(b), 'https://youtu.be/lmIj2y1ykes?t=3753');
  assert.equal(storyTime(b), '1:02:33');
  assert.equal(storyTime({ startSeconds: 96 }), '1:36');
  assert.equal(dayLabel('2026-10-05'), 'Mon, Oct 5');
});

test('a week older than four weeks is not current', () => {
  const w = parseMauiWeek(week([story()]));
  assert.equal(isCurrent(w, Date.parse('2026-10-14T00:00:00Z')), true);
  assert.equal(isCurrent(w, Date.parse('2026-11-20T00:00:00Z')), false);
});

test('the publish script keeps app fields, drops malformed stories and holds back election stories', async () => {
  const { buildMauiWeek } = await import('../../../content/publish-maui-daily.mjs');
  const { week: out, dropped, heldBack } = buildMauiWeek({
    ...week([
      story({ internal: 'must not ship' }),
      story({ id: 'p-2', headline: 'Council candidate forum draws crowd' }),
      story({ id: 'p-3', headline: 'Beach cleanup', topics: ['Election 2026'] }),
      story({ id: 'p-4', headline: 'Ballot measure explained', summary: '' }),
      story({ id: 'p-5', headline: '', summary: 'x' }),
    ]),
    secret: 'must not ship',
  });
  assert.deepEqual(out.stories.map(s => s.id), ['261005-01']);
  assert.equal(dropped, 1);
  assert.equal(heldBack, 3);
  assert.ok(!('secret' in out) && !('internal' in out.stories[0]));
  assert.deepEqual(Object.keys(out.stories[0]).sort(), ['dateISO', 'durationSeconds', 'episodeId', 'headline', 'id', 'kind', 'picked', 'startSeconds', 'summary', 'topics', 'youtubeId']);
  assert.throws(() => buildMauiWeek({ weekStart: '2026-10-05', stories: [] }), /no usable stories/);
  assert.throws(() => buildMauiWeek({ weekStart: 'bad', stories: [story()] }), /weekStart/);
  assert.throws(() => buildMauiWeek(null), /stories/);
});
