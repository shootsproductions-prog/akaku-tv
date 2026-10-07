// What is on now / next per channel, from akaku.org's own live feed (the same
// one the website's Watch Live section polls). Times are epoch seconds.
//
//   { generated, channels: { "53": { now: {title, live, start, end},
//       next: [{title, live, start, at}], thumb: {url, updated} }, ... } }
export const SCHEDULE_URL = 'https://www.akaku.org/?rest_route=/akaku/v1/now';

export type Program = { title: string; live: boolean; start: number; end: number | null };
export type ChannelSchedule = { now: Program | null; next: Program[]; thumb: string | null };
export type Schedule = Record<number, ChannelSchedule>;
export type NowNext = { now: Program | null; next: Program | null; progress: number };

const rec = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const sec = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v * 1000 : null);

function parseProgram(v: unknown): Program | null {
  const o = rec(v);
  const start = o ? sec(o.start) : null;
  if (!o || typeof o.title !== 'string' || !o.title || start === null) return null;
  return { title: o.title, live: o.live === true, start, end: sec(o.end) };
}

export function parseSchedule(raw: unknown): Schedule {
  const out: Schedule = {};
  const channels = rec(rec(raw)?.channels);
  if (!channels) return out;
  for (const [k, v] of Object.entries(channels)) {
    const num = Number(k);
    const o = rec(v);
    if (!Number.isInteger(num) || !o) continue;
    const thumb = rec(o.thumb)?.url;
    out[num] = {
      now: parseProgram(o.now),
      next: (Array.isArray(o.next) ? o.next : []).map(parseProgram).filter((p): p is Program => !!p).sort((a, b) => a.start - b.start),
      thumb: typeof thumb === 'string' && thumb.startsWith('https://') ? thumb : null,
    };
  }
  return out;
}

/** `at` is ms. A program that has already ended is not "on now"; the next poll replaces it. */
export function nowNext(ch: ChannelSchedule | undefined, at: number): NowNext {
  if (!ch) return { now: null, next: null, progress: 0 };
  const now = ch.now && ch.now.start <= at && (ch.now.end === null || at < ch.now.end) ? ch.now : null;
  const next = ch.next.find(p => p.start > at) ?? null;
  const progress = now && now.end ? Math.min(1, Math.max(0, (at - now.start) / (now.end - now.start))) : 0;
  return { now, next, progress };
}

export async function fetchSchedule(url = SCHEDULE_URL): Promise<Schedule | null> {
  if (!url) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) return null;
    const s = parseSchedule(await res.json());
    return Object.keys(s).length ? s : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
