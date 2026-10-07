// Per-channel program schedule: what is on now, what is next, how far in.
//
//   <SCHEDULE_URL>  ->  { "53": [{ "start": ISO, "end": ISO, "title": "..." }, ...], "54": [...], "55": [...] }
//
// Set SCHEDULE_URL to '' until a real feed exists: the app then shows no
// "On now" text at all rather than a made-up one.
export const SCHEDULE_URL = '';

export type Program = { start: number; end: number; title: string };
export type Schedule = Record<number, Program[]>;

export type NowNext = { now: Program | null; next: Program | null; progress: number };

export function parseSchedule(raw: unknown): Schedule {
  const out: Schedule = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const num = Number(k);
    if (!Number.isInteger(num) || !Array.isArray(v)) continue;
    const list: Program[] = [];
    for (const p of v) {
      const o = p as Record<string, unknown> | null;
      if (!o || typeof o.title !== 'string' || !o.title) continue;
      const start = Date.parse(String(o.start));
      const end = Date.parse(String(o.end));
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) list.push({ start, end, title: o.title });
    }
    out[num] = list.sort((a, b) => a.start - b.start);
  }
  return out;
}

export function nowNext(programs: Program[] | undefined, at: number): NowNext {
  const list = programs ?? [];
  const now = list.find(p => p.start <= at && at < p.end) ?? null;
  const next = list.find(p => p.start > at) ?? null;
  const progress = now ? Math.min(1, Math.max(0, (at - now.start) / (now.end - now.start))) : 0;
  return { now, next, progress };
}

export async function fetchSchedule(url = SCHEDULE_URL): Promise<Schedule | null> {
  if (!url) return null;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return parseSchedule(await res.json());
  } catch {
    return null;
  }
}
