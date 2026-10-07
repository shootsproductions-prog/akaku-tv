// The Issues catalog: a living list of the community's issues, curated in
// Pipeline and published as files (contract `issues-catalog` on the project board).
//
//   <CATALOG_BASE_URL>/index.json     -> { issues: ["<slug>.json"], aliases: {old: new}, defaultFollows: [slug] }
//   <CATALOG_BASE_URL>/<slug>.json    -> a CatalogIssue
//
// Rankings come from the raw counts in `signals`; nothing here is a hidden score.

export const CATALOG_BASE_URL = 'https://raw.githubusercontent.com/shootsproductions-prog/akaku-tv/HEAD/content/issues';

export type IssueStatus = 'active' | 'quiet' | 'resolved';
/** said-at-meeting: one meeting source. confirmed: two independent records agree. conflicting: sources disagree. */
export type Basis = 'said-at-meeting' | 'confirmed' | 'conflicting';
export type SourceType = 'meeting' | 'county-release' | 'county-page' | 'other';

export type EntrySource =
  | { type: 'meeting'; videoId: string; ts: string; retrievedISO: string }
  | { type: Exclude<SourceType, 'meeting'>; url: string; publisher: string; quote: string; retrievedISO: string };

export type TimelineEntry = { dateISO: string; text: string; basis: Basis; source: EntrySource; conflictGroup?: string };

export type UpcomingEvent = { dateISO: string; what: string; source: EntrySource };

export type Signals = {
  meetingsLast30d: number;
  meetingsLast90d: number;
  mentionsLast30d: number;
  upcomingEvent: UpcomingEvent | null;
};

export type CatalogIssue = {
  slug: string;
  title: string;
  summary: string;
  topics: string[];
  status: IssueStatus;
  pinned: boolean;
  firstSeenISO: string;
  lastSeenISO: string;
  signals: Signals;
  timeline: TimelineEntry[];
  disclaimer: string;
  sourceTypes: SourceType[];
};

export type CatalogIndex = { issues: string[]; aliases: Record<string, string>; defaultFollows: string[] };
export type Catalog = CatalogIndex & { list: CatalogIssue[] };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}/;
const SOURCE_TYPES: SourceType[] = ['meeting', 'county-release', 'county-page', 'other'];
const BASES: Basis[] = ['said-at-meeting', 'confirmed', 'conflicting'];
const STATUSES: IssueStatus[] = ['active', 'quiet', 'resolved'];

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const rec = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const count = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null);
const strings = (v: unknown) => (Array.isArray(v) ? v.filter(isStr) : []);

export function parseSource(v: unknown): EntrySource | null {
  const o = rec(v);
  if (!o || !isStr(o.retrievedISO) || !SOURCE_TYPES.includes(o.type as SourceType)) return null;
  if (o.type === 'meeting') {
    if (!isStr(o.videoId) || !/^[A-Za-z0-9_-]+$/.test(o.videoId) || !isStr(o.ts) || !/^\d{1,2}(:\d{2}){1,2}$/.test(o.ts)) return null;
    return { type: 'meeting', videoId: o.videoId, ts: o.ts, retrievedISO: o.retrievedISO };
  }
  if (!isStr(o.url) || !o.url.startsWith('https://') || !isStr(o.publisher) || !isStr(o.quote)) return null;
  return { type: o.type as Exclude<SourceType, 'meeting'>, url: o.url, publisher: o.publisher, quote: o.quote, retrievedISO: o.retrievedISO };
}

function parseEntry(v: unknown): TimelineEntry | null {
  const o = rec(v);
  const source = o ? parseSource(o.source) : null;
  if (!o || !source || !isStr(o.dateISO) || !DATE.test(o.dateISO) || !isStr(o.text) || !BASES.includes(o.basis as Basis)) return null;
  const e: TimelineEntry = { dateISO: o.dateISO, text: o.text, basis: o.basis as Basis, source };
  if (isStr(o.conflictGroup)) e.conflictGroup = o.conflictGroup;
  if (e.basis === 'conflicting' && !e.conflictGroup) return null;
  return e;
}

/** Returns a CatalogIssue, or null if the file is unusable. Unusable timeline entries are dropped, never guessed. */
export function parseCatalogIssue(raw: unknown): CatalogIssue | null {
  const o = rec(raw);
  if (!o || !isStr(o.slug) || !SLUG.test(o.slug) || !isStr(o.title) || !isStr(o.summary)) return null;
  if (!STATUSES.includes(o.status as IssueStatus)) return null; // includes "proposed": never shown
  if (!isStr(o.firstSeenISO) || !DATE.test(o.firstSeenISO) || !isStr(o.lastSeenISO) || !DATE.test(o.lastSeenISO)) return null;
  const sig = rec(o.signals);
  const m30 = count(sig?.meetingsLast30d), m90 = count(sig?.meetingsLast90d), mm = count(sig?.mentionsLast30d);
  if (!sig || m30 === null || m90 === null || mm === null) return null;
  const ev = rec(sig.upcomingEvent);
  const evSource = ev ? parseSource(ev.source) : null;
  const upcomingEvent = ev && evSource && isStr(ev.dateISO) && isStr(ev.what) ? { dateISO: ev.dateISO, what: ev.what, source: evSource } : null;
  const timeline = (Array.isArray(o.timeline) ? o.timeline : []).map(parseEntry).filter((e): e is TimelineEntry => !!e).sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  return {
    slug: o.slug,
    title: o.title,
    summary: o.summary,
    topics: strings(o.topics),
    status: o.status as IssueStatus,
    pinned: o.pinned === true,
    firstSeenISO: o.firstSeenISO,
    lastSeenISO: o.lastSeenISO,
    signals: { meetingsLast30d: m30, meetingsLast90d: m90, mentionsLast30d: mm, upcomingEvent },
    timeline,
    disclaimer: isStr(o.disclaimer) ? o.disclaimer : 'Summarized by Akakū Intelligence. It can make mistakes.',
    sourceTypes: [...new Set(timeline.map(e => e.source.type))],
  };
}

export function parseIndex(raw: unknown): CatalogIndex {
  const o = rec(raw);
  const aliases: Record<string, string> = {};
  for (const [k, v] of Object.entries(rec(o?.aliases) ?? {})) if (SLUG.test(k) && isStr(v) && SLUG.test(v)) aliases[k] = v;
  return { issues: strings(o?.issues).filter(n => /^[a-z0-9-]+\.json$/.test(n)), aliases, defaultFollows: strings(o?.defaultFollows).filter(s => SLUG.test(s)) };
}

/** Follow merge aliases (A merged into B merged into C). A loop in the data stops at the start. */
export function resolveSlug(slug: string, aliases: Record<string, string>): string {
  const seen = new Set<string>();
  let cur = slug;
  while (aliases[cur] && !seen.has(cur)) {
    seen.add(cur);
    cur = aliases[cur];
  }
  return cur;
}

/** Heating up: at least two meetings in 30 days, and at least twice the 30-day share of the last 90 days. */
export function isHeatingUp(s: Signals): boolean {
  return s.meetingsLast30d >= 2 && s.meetingsLast30d >= (2 * s.meetingsLast90d) / 3;
}

/** The reason an issue ranks where it does, in words, taken straight from the counts. */
export function whyRanked(i: CatalogIssue): string {
  const n = i.signals.meetingsLast30d;
  const parts = [n === 0 ? 'Not discussed in a meeting this month' : `Discussed in ${n} ${n === 1 ? 'meeting' : 'meetings'} this month`];
  const ev = i.signals.upcomingEvent;
  if (ev) parts.push(`${ev.what} on ${ev.dateISO}`);
  return parts.join(' · ');
}

/** Resolved issues last; then pinned, then meetings in 30 days, then most recently seen. */
export function rankIssues(list: CatalogIssue[]): CatalogIssue[] {
  return [...list].sort(
    (a, b) =>
      Number(a.status === 'resolved') - Number(b.status === 'resolved') ||
      Number(b.pinned) - Number(a.pinned) ||
      b.signals.meetingsLast30d - a.signals.meetingsLast30d ||
      b.lastSeenISO.localeCompare(a.lastSeenISO),
  );
}

async function getJson(url: string): Promise<unknown | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Null when the catalog is empty or unreachable; the app then keeps showing the four topics. */
export async function fetchCatalog(base = CATALOG_BASE_URL): Promise<Catalog | null> {
  if (!base) return null;
  const index = parseIndex(await getJson(`${base}/index.json`));
  if (!index.issues.length) return null;
  const files = await Promise.all(index.issues.map(n => getJson(`${base}/${n}`)));
  const list = rankIssues(files.map(parseCatalogIssue).filter((i): i is CatalogIssue => !!i));
  return list.length ? { ...index, list } : null;
}
