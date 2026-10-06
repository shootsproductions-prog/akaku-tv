import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { ISSUE_LABELS } from '../src/data/issues.ts';
import { parseIssue, parseRecap } from '../src/data/remote.ts';
import { groupIssues, isYoutubeId, seekSeconds, sortRecaps, youtubeUrl } from '../src/lib/recaps.ts';
import { voteSides } from '../src/lib/votes.ts';

const load = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const sept28 = () => parseRecap(load('H9lx2zorcDM.publish.json'));
const water = () => parseRecap(load('pW7rT2xY5bM.publish.json'));
const council = () => parseRecap(load('kQ3vN0w8aZc.publish.json'));

test('the Sept 28 publishable file loads', () => {
  const r = sept28();
  assert.ok(r);
  assert.equal(r.videoId, 'H9lx2zorcDM');
  assert.equal(r.meetingDateISO, '2026-09-28');
  assert.equal(r.meeting.id, 'H9lx2zorcDM');
  assert.equal(r.meeting.body, 'Civil Service Commission');
  assert.equal(r.meeting.dur, '27 m');
  assert.equal(r.source.youtubeUrl, 'https://youtu.be/H9lx2zorcDM');
  assert.match(r.disclaimer, /Summarized by Akakū Intelligence\. It can make mistakes\./);
  assert.deepEqual(r.meeting.votes, []);
  // every recap sentence carries a proof marker, in time order
  const marks = [...r.meeting.recap.matchAll(/\[\[(\d+:\d{2}:\d{2})\]\]/g)].map(m => seekSeconds(m[1]));
  assert.equal(marks.length, 14);
  assert.deepEqual(marks, [...marks].sort((a, b) => a - b));
});

test('ayes 5 / noes null: aye is shown, no is "not stated"', () => {
  const { meeting } = sept28();
  assert.equal(meeting.ayes, 5);
  assert.equal(meeting.noes, null);
  assert.deepEqual(voteSides(meeting), [
    { label: 'Aye', n: 5 },
    { label: 'No', n: null },
  ]);
});

test('neither count stated: no sides, the screen explains', () => {
  assert.deepEqual(voteSides({ ayes: null, noes: null }), []);
  assert.deepEqual(voteSides({ ayes: 7, noes: 2 }), [
    { label: 'Aye', n: 7 },
    { label: 'No', n: 2 },
  ]);
});

test('issues [] means no issue cards, but the meeting still lists', () => {
  const r = sept28();
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.topics, []);
  const grouped = groupIssues([r], ISSUE_LABELS);
  for (const label of ISSUE_LABELS) assert.equal(grouped[label].length, 0);
  assert.deepEqual(sortRecaps([r]).map(x => x.meeting.id), ['H9lx2zorcDM']);
});

test('meetings sort newest first by meetingDateISO', () => {
  const order = sortRecaps([water(), sept28(), council()]).map(r => r.videoId);
  assert.deepEqual(order, ['kQ3vN0w8aZc', 'H9lx2zorcDM', 'pW7rT2xY5bM']);
});

test('the four issue pages group issues from every meeting, newest meeting first', () => {
  const g = groupIssues([water(), sept28(), council()], ISSUE_LABELS);
  assert.deepEqual(g.Water.map(e => e.recap.videoId), ['kQ3vN0w8aZc', 'pW7rT2xY5bM']);
  assert.deepEqual(g.Housing.map(e => e.recap.videoId), ['kQ3vN0w8aZc']);
  assert.equal(g['Food Security'].length, 0);
  assert.equal(g['Disaster Recovery'].length, 0);
  // each issue keeps its own footnotes pointing at its own video
  const first = g.Water[1];
  assert.equal(first.issue.sources[0].view.id, 'pW7rT2xY5bM');
  assert.equal(first.issue.sources[0].seek, '1:02:14');
  assert.match(first.issue.brief, /\[\[#1\]\].*\[\[#2\]\]/);
});

test('"other" and unknown issue labels are rejected; the meeting still loads', () => {
  const file = load('pW7rT2xY5bM.publish.json');
  file.issues.push({ ...file.issues[0], issue: 'other' }, { ...file.issues[0], issue: 'Parks' });
  const r = parseRecap(file);
  assert.equal(r.issues.length, 1);
  assert.equal(parseIssue({ ...file.issues[0], issue: 'other' }), null);
});

test('a missing disclaimer falls back to the standard one; a broken file is rejected', () => {
  const file = load('H9lx2zorcDM.publish.json');
  delete file.disclaimer;
  assert.equal(parseRecap(file).disclaimer, 'Summarized by Akakū Intelligence. It can make mistakes.');
  assert.equal(parseRecap({ meeting: { id: 'x' } }), null);
  assert.equal(parseRecap(null), null);
});

test('proof links open the video at the right second', () => {
  assert.equal(seekSeconds('0:03:10'), 190);
  assert.equal(seekSeconds('1:02:14'), 3734);
  assert.equal(seekSeconds('3:10'), 190);
  assert.equal(seekSeconds('nonsense'), 0);
  assert.equal(youtubeUrl('H9lx2zorcDM', '0:03:10'), 'https://youtu.be/H9lx2zorcDM?t=190');
  assert.ok(isYoutubeId('H9lx2zorcDM'));
  assert.ok(!isYoutubeId('m1')); // demo meetings are not YouTube videos
});
