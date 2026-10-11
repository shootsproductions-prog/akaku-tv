#!/usr/bin/env node
// Publish the weekly "This week on The Maui Daily" file to the app (Live tab strip).
//
//   node content/publish-maui-daily.mjs path/to/maui-daily-week.json
//
// Input: contract `maui-daily-week` (v0) from Pipeline. Keeps only the fields the app uses, drops malformed
// stories, and drops any story about an election, candidate, campaign or ballot (Pipeline leaves those out
// until a person has reviewed them; this is a second guard). Writes content/maui-daily/week.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const YT = /^[A-Za-z0-9_-]{11}$/;
const SENSITIVE = /\b(elections?|candidates?|campaigns?|ballots?|polls?|voters?)\b/i;
const text = v => (typeof v === 'string' ? v.trim() : '');

/** Returns { week, dropped, heldBack }, or throws a plain-English Error if the input must not be published. */
export function buildMauiWeek(input) {
  if (!input || !Array.isArray(input.stories)) throw new Error('the file has no "stories" list');
  if (!DAY.test(text(input.weekStart))) throw new Error('weekStart must be a date like 2026-10-05');
  const seen = new Set();
  const stories = [];
  let dropped = 0;
  let heldBack = 0;
  for (const s of input.stories) {
    const id = text(s?.id);
    const headline = text(s?.headline);
    const start = s?.startSeconds;
    if (!id || seen.has(id) || !headline || !YT.test(text(s?.youtubeId)) || !DAY.test(text(s?.dateISO)) || typeof start !== 'number' || !Number.isFinite(start) || start < 0) {
      dropped++;
      continue;
    }
    const topics = Array.isArray(s.topics) ? s.topics.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim()) : [];
    if (SENSITIVE.test(headline) || SENSITIVE.test(text(s.summary)) || topics.some(t => SENSITIVE.test(t))) {
      heldBack++;
      continue;
    }
    seen.add(id);
    stories.push({
      id,
      episodeId: text(s.episodeId),
      dateISO: text(s.dateISO),
      headline,
      summary: text(s.summary),
      topics,
      kind: text(s.kind),
      youtubeId: text(s.youtubeId),
      startSeconds: Math.floor(start),
      durationSeconds: Number.isFinite(s.durationSeconds) && s.durationSeconds > 0 ? Math.round(s.durationSeconds) : null,
      picked: s.picked === true,
    });
  }
  if (!stories.length) throw new Error('no usable stories left after checks');
  return {
    week: {
      weekStart: text(input.weekStart),
      generatedISO: text(input.generatedISO),
      disclaimer: text(input.disclaimer) || 'Summarized by Akakū Intelligence. It can make mistakes.',
      stories,
    },
    dropped,
    heldBack,
  };
}

function main(args) {
  const dir = process.env.CONTENT_DIR || join(dirname(fileURLToPath(import.meta.url)), 'maui-daily');
  const fail = msg => { console.error(`Error: ${msg}`); process.exit(1); };
  const src = args[0] ?? fail('usage: node content/publish-maui-daily.mjs <maui-daily-week.json>');
  let input;
  try { input = JSON.parse(readFileSync(src, 'utf8')); } catch (e) { fail(`could not read ${src}: ${e.message}`); }
  let out;
  try { out = buildMauiWeek(input); } catch (e) { fail(e.message); }
  writeFileSync(join(dir, 'week.json'), JSON.stringify(out.week, null, 2) + '\n');
  const picked = out.week.stories.filter(s => s.picked).length;
  console.log(`Published week of ${out.week.weekStart}: ${out.week.stories.length} stories, ${picked} picked (${out.dropped} dropped as malformed, ${out.heldBack} held back as election-related).`);
  if (!picked) console.log('Note: no story is marked picked, so the strip stays hidden in the app until a file with picks is published.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
