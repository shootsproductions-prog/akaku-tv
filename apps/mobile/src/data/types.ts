// Shapes for everything the app renders. The demo modules in this folder
// satisfy them today; real sources (Castus, YouTube, County calendar,
// Akakū Intelligence) should map into the same shapes.

/** Where a tap on a citation, timeline row or follow-up goes. */
export type Target = {
  /** External page (County release, Maui Recovers, etc.). */
  href?: string;
  /** A Channel 53 meeting recording in the app. */
  view?: { type: 'meeting'; id: string };
  /** Shorthand for `view` used by explainer + follow-up data. */
  mid?: string;
  /** Timestamp in the recording, `h:mm:ss`. */
  seek?: string;
  /** Another explainer, by id. */
  ex?: string;
};

export type Channel = {
  num: number;
  name: string;
  short: string;
  now: string;
  next: string;
  desc: string;
  isGov?: boolean;
  guide: { t: string; s: string }[];
  /** Castus HLS endpoint. `null` until roku-channel/live-channels has it. */
  hlsUrl: string | null;
  /** Fresh frame grab, refreshed on every open like akaku.org. */
  thumbnailUrl: string | null;
};

export type Vote = { seat: string; vote: 'Aye' | 'No' };

export type Meeting = {
  id: string;
  mon: string;
  day: string;
  date: string;
  body: string;
  dur: string;
  voteCount: number;
  voteItem: string;
  ayes: number;
  noes: number;
  summary: string;
  /** Plain-language recap with `[[h:mm:ss]]` proof markers. */
  recap: string;
  decided: string[];
  next: string;
  votes: Vote[];
  moments: { t: string; q: string }[];
};

export type TranscriptHit = {
  mid: string;
  meeting: string;
  time: string;
  quote: string;
  speaker: string;
};

export type RadioSlot = { time: string; show: string; host: string; now?: boolean };

export type FeedCategory = 'daily' | 'community' | 'elections' | 'molokai' | 'archive';

export type FeedItem = {
  id: string;
  pl: string;
  producer: string;
  av: string;
  community?: boolean;
  title: string;
  meta: string;
  dur: string;
  likes: number;
  comments: number;
  ph: string;
  cat: FeedCategory;
  /** Set once the feed is pulled from YouTube; enables inline play + thumbnail. */
  youtubeId?: string;
  thumbnailUrl?: string;
};

export type FeedFilter = { id: 'all' | FeedCategory; label: string };

export type Deadline = { d: string; t: string };

export type TimelineEvent = Target & {
  mon: string;
  day: string;
  source: string;
  kind: 'tv' | 'county';
  title: string;
  note: string;
  proof: string;
};

export type Source = Target & {
  n: number;
  title: string;
  where: string;
  cta?: string;
};

export type Issue = {
  since: string;
  oneLine: string;
  why: string;
  deadlines: Deadline[];
  next: string;
  /** Cross-referenced brief with `[[#n]]` source markers. */
  brief: string;
  timeline: TimelineEvent[];
  sources: Source[];
};

export type WeeklyBrief = {
  headline: string;
  items: { tag: string; kind: 'tv' | 'county'; title: string; why: string; proof: string; issue: string }[];
  deadlines: Deadline[];
};

export type Topic = { name: string; sub: string; badge: string };

export type Explainer = {
  id: string;
  tag: string;
  q: string;
  basis: string;
  meetings: number;
  short: string;
  /** `text` carries `[[#n]]` source markers. */
  reasons: { pct: string; title: string; text: string }[];
  history: (Target & { year: string; what: string; src: string })[];
  who: string;
  lever: string;
  sources: Source[];
};

export type CalDay = { dow: string; num: number; key: number };

export type CalEvent = {
  id: string;
  day: number;
  time: string;
  kind: 'Council' | 'Committee' | 'Commission' | 'Community';
  body: string;
  what: string;
  where: string;
  match: string;
  href?: string;
};

export type FollowUpStatus = 'Done' | 'In progress' | 'Scheduled' | 'Overdue';

export type FollowUp = Target & {
  id: string;
  status: FollowUpStatus;
  promise: string;
  who: string;
  said: string;
  due: string;
  update: string;
  proof: string;
};

export type CastDevice = { name: string; kind: string };
