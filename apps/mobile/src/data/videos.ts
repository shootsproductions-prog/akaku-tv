// Demo content ported from the Claude Design prototype (Akaku Screen.dc.html).
// County releases and Maui Recovers links are real; meeting quotes, votes and
// follow-ups are illustrative until Akakū Intelligence is wired in.
import type { FeedFilter, FeedItem } from './types';

export const FEED: FeedItem[] = [
  {
    id: "md1",
    pl: "The Maui Daily",
    producer: "Akakū News",
    av: "AK",
    title: "The Maui Daily — Friday, October 2: Council extends Lahaina housing permits; County Fair opens",
    meta: "2 days ago",
    dur: "28:14",
    likes: 214,
    comments: 37,
    ph: "Episode thumbnail",
    cat: "daily"
  },
  {
    id: "cm1",
    pl: "Community",
    producer: "Lahaina Strong",
    av: "LS",
    community: true,
    title: "Public comment outside Council Chambers before the short-term rental vote — the full 40 minutes",
    meta: "3 days ago",
    dur: "41:08",
    likes: 892,
    comments: 164,
    ph: "Community footage",
    cat: "community"
  },
  {
    id: "el1",
    pl: "2026 Elections",
    producer: "Akakū Elections",
    av: "AK",
    title: "Council candidate forum: West Maui residency seat",
    meta: "1 week ago",
    dur: "1:12:40",
    likes: 341,
    comments: 58,
    ph: "Forum thumbnail",
    cat: "elections"
  },
  {
    id: "cm2",
    pl: "Community",
    producer: "Kīhei Parents Hui",
    av: "KP",
    community: true,
    title: "Why we need the high school road to avoid Piʻilani at 7 AM — parents speak",
    meta: "1 week ago",
    dur: "6:52",
    likes: 455,
    comments: 71,
    ph: "Community footage",
    cat: "community"
  },
  {
    id: "mo1",
    pl: "Akakū Molokaʻi",
    producer: "Akakū Molokaʻi",
    av: "MO",
    title: "Molokaʻi High homecoming 2026",
    meta: "Sep 26",
    dur: "52:00",
    likes: 603,
    comments: 42,
    ph: "Molokaʻi thumbnail",
    cat: "molokai"
  },
  {
    id: "mb1",
    pl: "Maui Business Tuesdays",
    producer: "Akakū Upstairs",
    av: "AU",
    title: "Running a food truck on three islands",
    meta: "Tuesday",
    dur: "41:20",
    likes: 128,
    comments: 12,
    ph: "Salon thumbnail",
    cat: "daily"
  },
  {
    id: "cm3",
    pl: "Community",
    producer: "Hālau o Maui",
    av: "HM",
    community: true,
    title: "Hōʻike 2026 — full performance",
    meta: "Sep 20",
    dur: "1:48:30",
    likes: 1203,
    comments: 88,
    ph: "Community footage",
    cat: "community"
  },
  {
    id: "ar1",
    pl: "Archive",
    producer: "Akakū Archive",
    av: "70",
    title: "Hoʻolauleʻa O Hāna (1970)",
    meta: "Archive · Aug 16, 1970",
    dur: "1:25:23",
    likes: 2310,
    comments: 201,
    ph: "Archive frame",
    cat: "archive"
  },
  {
    id: "ar2",
    pl: "Archive",
    producer: "Akakū Archive",
    av: "85",
    title: "Nā Mele: An Evening of Slack-Key with Honokaʻa Musicians",
    meta: "Archive · Jul 12, 1985",
    dur: "1:09:47",
    likes: 1744,
    comments: 96,
    ph: "Archive frame",
    cat: "archive"
  }
];

export const FEED_FILTERS: FeedFilter[] = [
  {
    id: "all",
    label: "All"
  },
  {
    id: "community",
    label: "Community"
  },
  {
    id: "daily",
    label: "The Maui Daily"
  },
  {
    id: "elections",
    label: "Elections 2026"
  },
  {
    id: "molokai",
    label: "Molokaʻi"
  },
  {
    id: "archive",
    label: "Archive"
  }
];

export const SUB_KINDS: string[] = [
  "Public comment",
  "Protest / rally",
  "Culture & hula",
  "Event",
  "News tip",
  "Other"
];
