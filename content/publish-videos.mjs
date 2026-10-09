#!/usr/bin/env node
// Publish Akakū's YouTube channel feed to the app (Videos tab).
//
//   node content/publish-videos.mjs path/to/feed.json
//
// Input: { videos: [{ id, title, publishedISO, durationSeconds, isShort? }] } from Pipeline.
// Keeps regular videos only (Shorts and anything 60 seconds or shorter are dropped), keeps only the
// fields the app uses, sorts newest first, and writes content/videos/feed.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ID = /^[A-Za-z0-9_-]{11}$/;

/** Returns the published feed, or throws a plain-English Error if the input must not be published. */
export function buildVideoFeed(input, generatedAt = new Date().toISOString()) {
  if (!input || !Array.isArray(input.videos)) throw new Error('the file has no "videos" list');
  const seen = new Set();
  const videos = [];
  let dropped = 0;
  for (const v of input.videos) {
    const title = typeof v?.title === 'string' ? v.title.trim() : '';
    const dur = Number.isFinite(v?.durationSeconds) ? v.durationSeconds : null;
    if (!ID.test(v?.id ?? '') || !title || seen.has(v.id)) { dropped++; continue; }
    if (v.isShort === true || (dur !== null && dur <= 60)) { dropped++; continue; }
    if (typeof v.publishedISO !== 'string' || Number.isNaN(Date.parse(v.publishedISO))) throw new Error(`video ${v.id} has no valid publishedISO`);
    seen.add(v.id);
    videos.push({ id: v.id, title, publishedISO: v.publishedISO, ...(dur !== null ? { durationSeconds: Math.round(dur) } : {}) });
  }
  if (!videos.length) throw new Error('no regular videos left after removing Shorts and unusable rows');
  videos.sort((a, b) => b.publishedISO.localeCompare(a.publishedISO));
  return { feed: { generatedAt, videos }, dropped };
}

function main(args) {
  const dir = process.env.CONTENT_DIR || join(dirname(fileURLToPath(import.meta.url)), 'videos');
  const fail = msg => { console.error(`Error: ${msg}`); process.exit(1); };
  const src = args[0] ?? fail('usage: node content/publish-videos.mjs <feed.json>');
  let input;
  try { input = JSON.parse(readFileSync(src, 'utf8')); } catch (e) { fail(`could not read ${src}: ${e.message}`); }
  let out;
  try { out = buildVideoFeed(input); } catch (e) { fail(e.message); }
  writeFileSync(join(dir, 'feed.json'), JSON.stringify(out.feed, null, 2) + '\n');
  console.log(`Published ${out.feed.videos.length} videos (${out.dropped} dropped: Shorts, duplicates or unusable rows).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
