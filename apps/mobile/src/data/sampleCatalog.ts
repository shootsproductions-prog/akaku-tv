// SAMPLE catalog, for trying the follow flow and issue pages before real issues are published.
// Shown only when the app is started in development with EXPO_PUBLIC_SAMPLE_CATALOG=1.
// Every title starts with "Sample" and every statement is placeholder text, not a fact.
import { parseCatalogIssue, rankIssues, type Catalog, type CatalogIssue } from './catalog.ts';

const retrievedISO = '2026-10-06T08:00:00Z';
const meeting = (ts: string) => ({ type: 'meeting' as const, videoId: 'H9lx2zorcDM', ts, retrievedISO });
const page = (publisher: string) => ({
  type: 'county-page' as const,
  url: 'https://www.mauicounty.gov/',
  publisher,
  quote: 'Placeholder quote for the sample page.',
  retrievedISO,
});
const DISCLAIMER = 'Summarized by Akakū Intelligence. It can make mistakes.';

const raw = [
  {
    slug: 'sample-water-meters',
    title: 'Sample · Upcountry water meters',
    summary: 'Placeholder summary showing how an issue is introduced in two or three sentences.',
    topics: ['water'],
    status: 'active',
    pinned: true,
    firstSeenISO: '2026-08-12',
    lastSeenISO: '2026-10-06',
    signals: { meetingsLast30d: 3, meetingsLast90d: 5, mentionsLast30d: 6, upcomingEvent: null },
    timeline: [
      { dateISO: '2026-10-06', text: 'Sample entry: something was said at a meeting.', basis: 'said-at-meeting', source: meeting('0:12:40') },
      { dateISO: '2026-09-28', text: 'Sample entry: a vote seen in the video and in the minutes.', basis: 'confirmed', source: page('Sample County page') },
      { dateISO: '2026-09-15', text: 'Sample entry: one source gives a number.', basis: 'conflicting', conflictGroup: 'g1', source: meeting('1:02:33') },
      { dateISO: '2026-09-15', text: 'Sample entry: another source gives a different number.', basis: 'conflicting', conflictGroup: 'g1', source: page('Sample County release') },
    ],
    disclaimer: DISCLAIMER,
  },
  {
    slug: 'sample-water-rates',
    title: 'Sample · Water rates',
    summary: 'Placeholder summary for a second water issue that new people also start out following.',
    topics: ['water'],
    status: 'active',
    pinned: false,
    firstSeenISO: '2026-09-01',
    lastSeenISO: '2026-09-30',
    signals: { meetingsLast30d: 1, meetingsLast90d: 2, mentionsLast30d: 2, upcomingEvent: null },
    timeline: [{ dateISO: '2026-09-30', text: 'Sample entry: something was said at a meeting.', basis: 'said-at-meeting', source: meeting('0:44:10') }],
    disclaimer: DISCLAIMER,
  },
  {
    slug: 'sample-water-quality',
    title: 'Sample · Drinking water quality',
    summary: 'Placeholder summary for a quiet issue with nothing new lately.',
    topics: ['water'],
    status: 'quiet',
    pinned: false,
    firstSeenISO: '2026-06-02',
    lastSeenISO: '2026-07-20',
    signals: { meetingsLast30d: 0, meetingsLast90d: 1, mentionsLast30d: 0, upcomingEvent: null },
    timeline: [],
    disclaimer: DISCLAIMER,
  },
  {
    slug: 'sample-roads',
    title: 'Sample · Speed bumps',
    summary: 'Placeholder summary for an issue that is heating up.',
    topics: ['roads'],
    status: 'active',
    pinned: false,
    firstSeenISO: '2026-09-10',
    lastSeenISO: '2026-10-05',
    signals: { meetingsLast30d: 4, meetingsLast90d: 5, mentionsLast30d: 7, upcomingEvent: { dateISO: '2026-10-21', what: 'Committee vote', source: page('Sample agenda') } },
    timeline: [{ dateISO: '2026-10-05', text: 'Sample entry: something was said at a meeting.', basis: 'said-at-meeting', source: meeting('0:30:05') }],
    disclaimer: DISCLAIMER,
  },
  {
    slug: 'sample-housing',
    title: 'Sample · Short-term rental rules',
    summary: 'Placeholder summary for a resolved issue.',
    topics: ['housing'],
    status: 'resolved',
    pinned: false,
    firstSeenISO: '2026-05-01',
    lastSeenISO: '2026-08-30',
    signals: { meetingsLast30d: 0, meetingsLast90d: 1, mentionsLast30d: 0, upcomingEvent: null },
    timeline: [],
    disclaimer: DISCLAIMER,
  },
];

const list = rankIssues(raw.map(parseCatalogIssue).filter((i): i is CatalogIssue => !!i));

export const SAMPLE_CATALOG: Catalog = {
  issues: list.map(i => `${i.slug}.json`),
  aliases: {},
  defaultFollows: ['sample-water-meters', 'sample-water-rates'],
  list,
};
