// Published County Watch recaps. Pipeline's county-watch step writes one JSON
// file per reviewed meeting; an index.json beside them lists the files.
//
//   <CONTENT_BASE_URL>/index.json            -> { "meetings": ["H9lx2zorcDM.json", ...] }
//   <CONTENT_BASE_URL>/H9lx2zorcDM.json      -> { "meeting": Meeting, ... }
//
// Served from this repo's default branch for now (see content/README.md).
// Set CONTENT_BASE_URL to '' to force the demo content.
import type { Meeting } from './types';

export const CONTENT_BASE_URL = 'https://raw.githubusercontent.com/shootsproductions-prog/akaku-tv/HEAD/content/meetings';

const FETCH_TIMEOUT_MS = 8000;

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const optCount = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Accepts a Pipeline recap file and returns a Meeting, or null if it is unusable. */
export function parseMeeting(file: unknown): Meeting | null {
  const m = (file as { meeting?: Record<string, unknown> } | null)?.meeting;
  if (!m || !isStr(m.id) || !isStr(m.body) || !isStr(m.date) || !isStr(m.recap)) return null;
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter(isStr) : []);
  return {
    id: m.id,
    mon: isStr(m.mon) ? m.mon : '',
    day: isStr(m.day) ? m.day : '',
    date: m.date,
    body: m.body,
    dur: isStr(m.dur) ? m.dur : '',
    voteCount: typeof m.voteCount === 'number' ? m.voteCount : 0,
    voteItem: isStr(m.voteItem) ? m.voteItem : '',
    ayes: optCount(m.ayes),
    noes: optCount(m.noes),
    summary: isStr(m.summary) ? m.summary : '',
    recap: m.recap,
    decided: strings(m.decided),
    next: isStr(m.next) ? m.next : '',
    votes: Array.isArray(m.votes)
      ? m.votes.filter(
          (v): v is { seat: string; vote: 'Aye' | 'No' } =>
            !!v && isStr((v as { seat?: unknown }).seat) && ['Aye', 'No'].includes((v as { vote?: string }).vote ?? ''),
        )
      : [],
    moments: Array.isArray(m.moments)
      ? m.moments.filter((x): x is { t: string; q: string } => !!x && isStr((x as { t?: unknown }).t) && isStr((x as { q?: unknown }).q))
      : [],
  };
}

async function getJson(url: string): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Fetches every published meeting. Files that fail to load or parse are skipped. */
export async function fetchMeetings(baseUrl: string = CONTENT_BASE_URL): Promise<Meeting[]> {
  if (!baseUrl) return [];
  const base = baseUrl.replace(/\/+$/, '');
  const index = (await getJson(`${base}/index.json`)) as { meetings?: unknown };
  const names = Array.isArray(index?.meetings) ? index.meetings.filter(isStr) : [];
  const loaded = await Promise.all(names.map(n => getJson(`${base}/${n}`).then(parseMeeting, () => null)));
  return loaded.filter((m): m is Meeting => m !== null);
}
