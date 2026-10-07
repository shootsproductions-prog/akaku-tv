import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseYoutubeFeed, timeAgo } from '../src/data/youtubeFeed.ts';

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
