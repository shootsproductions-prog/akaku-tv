// KAKU 88.5 FM: the live stream and the show schedule.
//
// RADIO_STREAM_URL is the address of the live audio stream (an https .mp3/.aac or .m3u8 URL).
// RADIO_SCHEDULE_URL is the akaku.org endpoint (website session's contract, draft v0):
//   { ready, now: show | null, next: show[] }  with show = { title, desc?, start, end, replay? }, epoch seconds.
// A plain list (or { shows: [...] }) of { title, host?, start, end } is also read.
// Until the website installs the endpoint (staff must confirm the weekly list) the request fails
// and the Radio tab shows no schedule; it never shows made-up shows.
export const RADIO_STREAM_URL = 'https://ice5.securenetsystems.net/KAKU';
export const RADIO_SCHEDULE_URL = 'https://www.akaku.org/?rest_route=/akaku/v1/radio';

export type RadioShow = { title: string; host: string | null; desc: string | null; replay: boolean; start: number; end: number };

const when = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v < 1e11 ? v * 1000 : v; // seconds or ms
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  return null;
};

/** Returns the shows sorted by start time, dropping anything unusable. All times are ms. */
export function parseRadioSchedule(raw: unknown): RadioShow[] {
  const o = raw as { shows?: unknown; programs?: unknown; ready?: unknown; now?: unknown; next?: unknown } | null;
  if (o && !Array.isArray(raw) && o.ready === false) return []; // staff have not confirmed the list yet
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(o?.shows) ? o.shows
    : Array.isArray(o?.programs) ? o.programs
    : o && (o.now || Array.isArray(o.next)) ? [o.now, ...(Array.isArray(o.next) ? o.next : [])]
    : [];
  const out: RadioShow[] = [];
  for (const item of list) {
    const r = item as Record<string, unknown> | null;
    const start = when(r?.start);
    const end = when(r?.end);
    const title = typeof r?.title === 'string' ? r.title.trim() : '';
    if (!title || start === null || end === null || end <= start) continue;
    const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    out.push({ title, host: text(r?.host), desc: text(r?.desc), replay: r?.replay === true, start, end });
  }
  return out.sort((a, b) => a.start - b.start);
}

export function radioNowNext(shows: RadioShow[], at: number): { now: RadioShow | null; upcoming: RadioShow[] } {
  return { now: shows.find(s => s.start <= at && at < s.end) ?? null, upcoming: shows.filter(s => s.start > at) };
}

export async function fetchRadioSchedule(url = RADIO_SCHEDULE_URL): Promise<RadioShow[] | null> {
  if (!url) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) return null;
    const shows = parseRadioSchedule(await res.json());
    return shows.length ? shows : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
