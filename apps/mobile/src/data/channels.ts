// Demo content ported from the Claude Design prototype (Akaku Screen.dc.html).
// County releases and Maui Recovers links are real; meeting quotes, votes and
// follow-ups are illustrative until Akakū Intelligence is wired in.
import type { Channel } from './types';
import { LIVE_FEEDS, liveUrl } from './liveFeeds';

const BASE_CHANNELS: Channel[] = [
  {
    num: 55,
    name: "Live & Local",
    short: "Live & Local",
    now: "The Maui Daily",
    next: "7:30 Maui Business Tuesdays",
    desc: "Local shows and live community events. Tonight: The Maui Daily, then salons recorded at Akakū Upstairs.",
    guide: [
      {
        t: "7:00 PM",
        s: "The Maui Daily"
      },
      {
        t: "7:30 PM",
        s: "Maui Business Tuesdays"
      },
      {
        t: "8:30 PM",
        s: "Akakū Molokaʻi — Molokaʻi High homecoming"
      },
      {
        t: "9:30 PM",
        s: "Elections 2026: West Maui council forum (replay)"
      }
    ],
    hlsUrl: null,
    thumbnailUrl: null
  },
  {
    num: 54,
    name: "All Access All The Time",
    short: "All Access",
    now: "Nā Mele: Slack-Key with Honokaʻa Musicians",
    next: "8:10 Pacific Talk",
    desc: "Community-made shows, all the time. Anything a member produced can air here.",
    guide: [
      {
        t: "7:00 PM",
        s: "Nā Mele: Slack-Key with Honokaʻa Musicians"
      },
      {
        t: "8:10 PM",
        s: "Pacific Talk: Interview with Auntie Makaha"
      },
      {
        t: "8:45 PM",
        s: "Maui County Fair PSA + community shorts"
      },
      {
        t: "9:00 PM",
        s: "Hoʻolauleʻa O Hāna (1970)"
      }
    ],
    hlsUrl: null,
    thumbnailUrl: null
  },
  {
    num: 53,
    name: "Government & Public Affairs",
    short: "Government",
    now: "Maui County Council — Budget, Finance & Economic Development Committee",
    next: "9:00 Planning Commission (replay)",
    isGov: true,
    desc: "County Council, boards and commissions, gavel to gavel. Every meeting here is transcribed for Meeting Watch.",
    guide: [
      {
        t: "Now",
        s: "Council — Budget, Finance & Economic Development Committee"
      },
      {
        t: "9:00 PM",
        s: "Maui Planning Commission (Sep 30 replay)"
      },
      {
        t: "12:00 AM",
        s: "Board of Water Supply (Sep 25 replay)"
      }
    ],
    hlsUrl: null,
    thumbnailUrl: null
  }
];

export const CHANNELS: Channel[] = BASE_CHANNELS.map(ch => ({
  ...ch,
  hlsUrl: liveUrl(LIVE_FEEDS[ch.num]?.hlsUrl),
  thumbnailUrl: liveUrl(LIVE_FEEDS[ch.num]?.thumbnailUrl),
}));
