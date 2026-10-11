// "This week on The Maui Daily": a weekly list of stories from Akakū's daily news show, built by Pipeline.
//
//   <MAUI_DAILY_URL> -> { weekStart, generatedISO, episodes[], stories[], disclaimer }   (contract `maui-daily-week`, v0)
//
// The strip shows the week's `picked` stories, and "See all" lists every story by day. Each story opens
// the episode on YouTube at its first second. Headlines describe what aired; nothing here is fact-checked.
import { durationLabel } from './youtubeFeed.ts';

export const MAUI_DAILY_URL = 'https://raw.githubusercontent.com/shootsproductions-prog/akaku-tv/HEAD/content/maui-daily/week.json';

export const MAUI_DAILY_DISCLAIMER = 'Summarized by Akakū Intelligence. It can make mistakes.';

export type MauiStory = {
  id: string;
  episodeId: string;
  dateISO: string;
  headline: string;
  summary: string;
  topics: string[];
  kind: string;
  youtubeId: string;
  startSeconds: number;
  durationSeconds: number | null;
  picked: boolean;
};

export type MauiWeek = { weekStart: string; generatedISO: string; disclaimer: string; stories: MauiStory[] };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const YT = /^[A-Za-z0-9_-]{11}$/;
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Reads a week file. Anything malformed is dropped; returns null when no story survives. */
export function parseMauiWeek(raw: unknown): MauiWeek | null {
  const o = raw as { weekStart?: unknown; generatedISO?: unknown; disclaimer?: unknown; stories?: unknown } | null;
  if (!o || !Array.isArray(o.stories) || !DAY.test(text(o.weekStart))) return null;
  const seen = new Set<string>();
  const stories: MauiStory[] = [];
  for (const item of o.stories) {
    const s = item as Record<string, unknown> | null;
    const id = text(s?.id);
    const headline = text(s?.headline);
    const youtubeId = text(s?.youtubeId);
    const dateISO = text(s?.dateISO);
    const start = s?.startSeconds;
    if (!id || seen.has(id) || !headline || !YT.test(youtubeId) || !DAY.test(dateISO)) continue;
    if (typeof start !== 'number' || !Number.isFinite(start) || start < 0) continue;
    const dur = s?.durationSeconds;
    seen.add(id);
    stories.push({
      id,
      episodeId: text(s?.episodeId),
      dateISO,
      headline,
      summary: text(s?.summary),
      topics: Array.isArray(s?.topics) ? s.topics.filter((t): t is string => typeof t === 'string' && !!t.trim()).map(t => t.trim()) : [],
      kind: text(s?.kind),
      youtubeId,
      startSeconds: Math.floor(start),
      durationSeconds: typeof dur === 'number' && Number.isFinite(dur) && dur > 0 ? Math.round(dur) : null,
      picked: s?.picked === true,
    });
  }
  if (!stories.length) return null;
  return { weekStart: text(o.weekStart), generatedISO: text(o.generatedISO), disclaimer: text(o.disclaimer) || MAUI_DAILY_DISCLAIMER, stories };
}

export const pickedStories = (w: MauiWeek): MauiStory[] => w.stories.filter(s => s.picked);

/** Newest day first; within a day, stories stay in air order (the order Pipeline wrote them). */
export function groupByDay(stories: MauiStory[]): { dateISO: string; stories: MauiStory[] }[] {
  const days = new Map<string, MauiStory[]>();
  for (const s of stories) days.set(s.dateISO, [...(days.get(s.dateISO) ?? []), s]);
  return [...days.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([dateISO, list]) => ({ dateISO, stories: list }));
}

export const storyUrl = (s: Pick<MauiStory, 'youtubeId' | 'startSeconds'>) => `https://youtu.be/${s.youtubeId}?t=${s.startSeconds}`;

/** "1:36" or "1:02:33": where in the video the story starts. */
export const storyTime = (s: Pick<MauiStory, 'startSeconds'>) => durationLabel(s.startSeconds);

/** "Mon, Oct 5" from a YYYY-MM-DD date, without time-zone surprises. */
export function dayLabel(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** A week file older than three weeks is not shown: a stale strip is worse than none. */
export function isCurrent(w: MauiWeek, now = Date.now()): boolean {
  const t = Date.parse(`${w.weekStart}T00:00:00Z`);
  return Number.isFinite(t) && now - t < 28 * 24 * 3600 * 1000;
}

export async function fetchMauiWeek(url = MAUI_DAILY_URL): Promise<MauiWeek | null> {
  if (!url) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    return res.ok ? parseMauiWeek(await res.json()) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
