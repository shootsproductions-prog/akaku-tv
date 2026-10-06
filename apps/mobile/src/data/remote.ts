// Published County Watch recaps. Pipeline's county-watch step writes one JSON
// file per meeting; content/publish-meeting.mjs copies it, trimmed to the
// app-facing fields, into content/meetings/ and lists it in index.json.
//
//   <CONTENT_BASE_URL>/index.json            -> { "meetings": ["H9lx2zorcDM.json", ...] }
//   <CONTENT_BASE_URL>/H9lx2zorcDM.json      -> a PublishedRecap
//
// Set CONTENT_BASE_URL to '' to force the demo content.
import { DEFAULT_DISCLAIMER, isIssueLabel } from './issues.ts';
import type { Deadline, Issue, IssueLabel, Meeting, PublishedRecap, Source, TimelineEvent } from './types.ts';

// Served from this repo's default branch for now (see content/README.md).
export const CONTENT_BASE_URL = 'https://raw.githubusercontent.com/shootsproductions-prog/akaku-tv/HEAD/content/meetings';

const FETCH_TIMEOUT_MS = 8000;

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const optCount = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const rec = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** Accepts the `meeting` object of a recap file and returns a Meeting, or null if it is unusable. */
export function parseMeeting(m: unknown): Meeting | null {
  const o = rec(m);
  if (!o || !isStr(o.id) || !isStr(o.body) || !isStr(o.date) || !isStr(o.recap)) return null;
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter(isStr) : []);
  return {
    id: o.id,
    mon: str(o.mon),
    day: str(o.day),
    date: o.date,
    body: o.body,
    dur: str(o.dur),
    voteCount: typeof o.voteCount === 'number' ? o.voteCount : 0,
    voteItem: str(o.voteItem),
    ayes: optCount(o.ayes),
    noes: optCount(o.noes),
    summary: str(o.summary),
    recap: o.recap,
    decided: strings(o.decided),
    next: str(o.next),
    votes: Array.isArray(o.votes)
      ? o.votes.filter(
          (v): v is { seat: string; vote: 'Aye' | 'No' } => !!rec(v) && isStr(rec(v)!.seat) && ['Aye', 'No'].includes(str(rec(v)!.vote)),
        )
      : [],
    moments: Array.isArray(o.moments) ? o.moments.filter((x): x is { t: string; q: string } => !!rec(x) && isStr(rec(x)!.t) && isStr(rec(x)!.q)) : [],
  };
}

function target(o: Record<string, unknown>) {
  const view = rec(o.view);
  return {
    ...(isStr(o.href) ? { href: o.href } : {}),
    ...(view && view.type === 'meeting' && isStr(view.id) ? { view: { type: 'meeting' as const, id: view.id } } : {}),
    ...(isStr(o.seek) ? { seek: o.seek } : {}),
  };
}

/** One issue entry. Anything that is not one of the four tracked issues (including "other") is rejected. */
export function parseIssue(x: unknown): Issue | null {
  const o = rec(x);
  if (!o || !isIssueLabel(o.issue) || !isStr(o.oneLine) || !isStr(o.brief)) return null;
  const deadlines: Deadline[] = Array.isArray(o.deadlines)
    ? o.deadlines.filter((d): d is Deadline => !!rec(d) && isStr(rec(d)!.d) && isStr(rec(d)!.t)).map(d => ({ d: d.d, t: d.t }))
    : [];
  const sources: Source[] = Array.isArray(o.sources)
    ? o.sources.flatMap(s => {
        const so = rec(s);
        return so && typeof so.n === 'number' && isStr(so.title) ? [{ n: so.n, title: so.title, where: str(so.where), ...(isStr(so.cta) ? { cta: so.cta } : {}), ...target(so) }] : [];
      })
    : [];
  const timeline: TimelineEvent[] = Array.isArray(o.timeline)
    ? o.timeline.flatMap(t => {
        const to = rec(t);
        return to && isStr(to.title)
          ? [{ mon: str(to.mon), day: str(to.day), source: str(to.source), kind: to.kind === 'county' ? ('county' as const) : ('tv' as const), title: to.title, note: str(to.note), proof: str(to.proof), ...target(to) }]
          : [];
      })
    : [];
  return { issue: o.issue, since: str(o.since), oneLine: o.oneLine, why: str(o.why), deadlines, next: str(o.next), brief: o.brief, timeline, sources };
}

/** Accepts a published recap file and returns a PublishedRecap, or null if it is unusable. */
export function parseRecap(file: unknown): PublishedRecap | null {
  const o = rec(file);
  if (!o) return null;
  const meeting = parseMeeting(o.meeting);
  if (!meeting) return null;
  const issues = Array.isArray(o.issues) ? o.issues.map(parseIssue).filter((i): i is Issue => i !== null) : [];
  const topics = Array.isArray(o.topics) ? o.topics.filter(isIssueLabel) : ([...new Set(issues.map(i => i.issue))].filter(Boolean) as IssueLabel[]);
  const iso = str(o.meetingDateISO);
  return {
    videoId: isStr(o.videoId) ? o.videoId : meeting.id,
    status: str(o.status),
    disclaimer: isStr(o.disclaimer) ? o.disclaimer : DEFAULT_DISCLAIMER,
    generatedAt: str(o.generatedAt),
    meetingDateISO: /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : '',
    headline: str(o.headline, meeting.summary),
    topics,
    meeting,
    issues,
    ...(rec(o.source) && isStr(rec(o.source)!.youtubeUrl) ? { source: { youtubeUrl: rec(o.source)!.youtubeUrl as string } } : {}),
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

/** Fetches every published recap. Files that fail to load or parse are skipped. */
export async function fetchRecaps(baseUrl: string = CONTENT_BASE_URL): Promise<PublishedRecap[]> {
  if (!baseUrl) return [];
  const base = baseUrl.replace(/\/+$/, '');
  const index = (await getJson(`${base}/index.json`)) as { meetings?: unknown };
  const names = Array.isArray(index?.meetings) ? index.meetings.filter(isStr) : [];
  const loaded = await Promise.all(names.map(n => getJson(`${base}/${n}`).then(parseRecap, () => null)));
  return loaded.filter((r): r is PublishedRecap => r !== null);
}
