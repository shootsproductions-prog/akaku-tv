import assert from 'node:assert/strict';
import { test } from 'node:test';

import { durationLabel, parseVideoFeed, parseYoutubeFeed, timeAgo } from '../src/data/youtubeFeed.ts';

// Shape of YouTube's public Atom feed (made-up ids and titles).
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>County Watch</title><author><name>Akakū Maui Community Media</name></author>
 <entry>
  <id>yt:video:AAAAAAAAAAA</id><yt:videoId>AAAAAAAAAAA</yt:videoId>
  <title>Council &amp; Committee: Water &quot;Rates&quot; Hearing</title>
  <author><name>Akakū Maui Community Media</name></author>
  <published>2026-10-05T01:00:00+00:00</published>
  <media:group><media:thumbnail url="https://i.ytimg.com/vi/AAAAAAAAAAA/hqdefault.jpg"/></media:group>
 </entry>
 <entry><yt:videoId>bad</yt:videoId><title>Not an id</title><published>2026-10-04T00:00:00+00:00</published></entry>
 <entry><yt:videoId>BBBBBBBBBBB</yt:videoId><title></title></entry>
 <entry><yt:videoId>CCCCCCCCCCC</yt:videoId><title>Planning Commission</title><author><name>Akakū</name></author><published>2026-09-20T00:00:00+00:00</published></entry>
</feed>`;

test('reads entries, decodes text, and skips unusable ones', () => {
  const v = parseYoutubeFeed(xml);
  assert.deepEqual(v.map(x => x.id), ['AAAAAAAAAAA', 'CCCCCCCCCCC']);
  assert.equal(v[0].title, 'Council & Committee: Water "Rates" Hearing');
  assert.equal(v[0].author, 'Akakū Maui Community Media');
  assert.equal(v[0].thumbnailUrl, 'https://i.ytimg.com/vi/AAAAAAAAAAA/hqdefault.jpg');
  assert.deepEqual(parseYoutubeFeed('not xml'), []);
});

test('relative dates', () => {
  const now = Date.parse('2026-10-07T12:00:00Z');
  assert.equal(timeAgo('2026-10-07T01:00:00Z', now), 'Today');
  assert.equal(timeAgo('2026-10-06T01:00:00Z', now), 'Yesterday');
  assert.equal(timeAgo('2026-10-02T01:00:00Z', now), '5 days ago');
  assert.equal(timeAgo('garbage', now), '');
});

test('the channel feed keeps regular videos only, newest first, no duplicates', () => {
  const feed = { videos: [
    { id: 'AAAAAAAAAAA', title: 'Council meeting', publishedISO: '2026-10-01T00:00:00Z', durationSeconds: 5400 },
    { id: 'BBBBBBBBBBB', title: 'A Short', publishedISO: '2026-10-05T00:00:00Z', durationSeconds: 45 },
    { id: 'CCCCCCCCCCC', title: 'Marked short', publishedISO: '2026-10-06T00:00:00Z', durationSeconds: 120, isShort: true },
    { id: 'DDDDDDDDDDD', title: 'Maui Daily', publishedISO: '2026-10-07T00:00:00Z', durationSeconds: 1700 },
    { id: 'AAAAAAAAAAA', title: 'Duplicate', publishedISO: '2026-10-01T00:00:00Z' },
    { id: 'bad', title: 'Bad id' },
    { id: 'EEEEEEEEEEE', title: '  ' },
  ] };
  const v = parseVideoFeed(feed);
  assert.deepEqual(v.map(x => x.id), ['DDDDDDDDDDD', 'AAAAAAAAAAA']);
  assert.equal(v[0].thumbnailUrl, 'https://i.ytimg.com/vi/DDDDDDDDDDD/hqdefault.jpg');
  assert.deepEqual(parseVideoFeed(null), []);
  assert.equal(durationLabel(1700), '28:20');
  assert.equal(durationLabel(5400), '1:30:00');
});

test('the publish script keeps regular videos and refuses an empty or malformed feed', async () => {
  const { buildVideoFeed } = await import('../../../content/publish-videos.mjs');
  const { feed, dropped } = buildVideoFeed({ videos: [
    { id: 'AAAAAAAAAAA', title: ' Long ', publishedISO: '2026-10-01T00:00:00Z', durationSeconds: 900.4, secret: 'x' },
    { id: 'BBBBBBBBBBB', title: 'Short', publishedISO: '2026-10-02T00:00:00Z', durationSeconds: 30 },
    { id: 'AAAAAAAAAAA', title: 'Dup', publishedISO: '2026-10-01T00:00:00Z' },
  ] }, '2026-10-09T00:00:00Z');
  assert.deepEqual(feed.videos, [{ id: 'AAAAAAAAAAA', title: 'Long', publishedISO: '2026-10-01T00:00:00Z', durationSeconds: 900 }]);
  assert.equal(dropped, 2);
  assert.throws(() => buildVideoFeed({ videos: [] }), /no regular videos/);
  assert.throws(() => buildVideoFeed({}), /no "videos" list/);
  assert.throws(() => buildVideoFeed({ videos: [{ id: 'AAAAAAAAAAA', title: 'x', publishedISO: 'soon', durationSeconds: 900 }] }), /publishedISO/);
});
