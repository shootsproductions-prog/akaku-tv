// Demo content ported from the Claude Design prototype (Akaku Screen.dc.html).
// County releases and Maui Recovers links are real; meeting quotes, votes and
// follow-ups are illustrative until Akakū Intelligence is wired in.
import type { RadioSlot } from './types';

export const RADIO_SCHEDULE: RadioSlot[] = [
  {
    time: "6:00 AM",
    show: "Morning Mele",
    host: "Community host"
  },
  {
    time: "9:00 AM",
    show: "The Voice of Maui Hour",
    host: "Call-in · county issues"
  },
  {
    time: "12:00 PM",
    show: "Nā Mele Hawaiʻi",
    host: "Hawaiian music, all afternoon",
    now: true
  },
  {
    time: "3:00 PM",
    show: "Molokaʻi Hour",
    host: "From Kaunakakai"
  },
  {
    time: "7:00 PM",
    show: "The Maui Daily (simulcast)",
    host: "Akakū newsroom"
  },
  {
    time: "9:00 PM",
    show: "Late Slack-Key",
    host: "Community host"
  }
];
