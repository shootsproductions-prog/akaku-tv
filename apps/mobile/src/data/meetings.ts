// Demo content ported from the Claude Design prototype (Akaku Screen.dc.html).
// County releases and Maui Recovers links are real; meeting quotes, votes and
// follow-ups are illustrative until Akakū Intelligence is wired in.
import type { Meeting, TranscriptHit } from './types';

export const MEETINGS: Meeting[] = [
  {
    id: "m1",
    mon: "Oct",
    day: "2",
    date: "Fri, Oct 2, 2026",
    body: "Maui County Council",
    dur: "6 h 12 m",
    voteCount: 4,
    voteItem: "Bill 72 (Lahaina temporary housing permits)",
    ayes: 7,
    noes: 2,
    summary: "Lahaina temporary housing permits extended through 2028. Short-term rental phase-out deferred to Oct 16.",
    recap: "The Council took up 14 items.[[0:03:12]] It passed Bill 72 on first reading, extending Lahaina temporary housing permits through 2028, by a 7–2 vote.[[5:02:31]] The short-term rental phase-out amendment was deferred to October 16 after 48 people testified on it.[[0:42:10]][[4:48:05]] The Water Supply budget amendment moved to committee without discussion.[[5:40:19]] Total public testimony: 2 h 40 m, 61 testifiers.",
    decided: [
      "Bill 72 passed first reading, 7–2. Second reading Oct 16.",
      "Short-term rental phase-out amendment deferred to Oct 16.",
      "Water Supply budget amendment referred to Budget Committee."
    ],
    next: "Second reading of Bill 72 and the deferred rental amendment are both on the Oct 16 agenda.",
    votes: [
      {
        seat: "West Maui",
        vote: "Aye"
      },
      {
        seat: "South Maui",
        vote: "No"
      },
      {
        seat: "Kahului",
        vote: "Aye"
      },
      {
        seat: "Wailuku–Waiheʻe–Waikapū",
        vote: "Aye"
      },
      {
        seat: "Makawao–Haʻikū–Pāʻia",
        vote: "Aye"
      },
      {
        seat: "Upcountry",
        vote: "No"
      },
      {
        seat: "East Maui",
        vote: "Aye"
      },
      {
        seat: "Lānaʻi",
        vote: "Aye"
      },
      {
        seat: "Molokaʻi",
        vote: "Aye"
      }
    ],
    moments: [
      {
        t: "0:42:10",
        q: "Public testimony on the short-term rental amendment begins."
      },
      {
        t: "3:15:48",
        q: "“Lahaina water infrastructure has to come before any new permits.” — testifier, Lahaina"
      },
      {
        t: "5:02:31",
        q: "Roll call vote on Bill 72."
      }
    ]
  },
  {
    id: "m2",
    mon: "Sep",
    day: "30",
    date: "Wed, Sep 30, 2026",
    body: "Maui Planning Commission",
    dur: "3 h 05 m",
    voteCount: 2,
    voteItem: "SMA permit, Kīhei high school access road",
    ayes: 6,
    noes: 1,
    summary: "SMA permit approved for the Kīhei high school access road. Wailea hotel expansion deferred.",
    recap: "The Commission approved the Special Management Area permit for the Kīhei high school access road, 6–1,[[2:51:00]] with a condition that construction traffic avoid Piʻilani Highway during school hours.[[2:38:44]] The Wailea hotel expansion item was deferred at the applicant's request.[[0:06:20]]",
    decided: [
      "SMA permit for Kīhei high school access road approved, 6–1, with traffic condition.",
      "Wailea hotel expansion deferred at applicant's request."
    ],
    next: "The high school road goes to the Department of Public Works for permitting. Wailea expansion returns Oct 28.",
    votes: [
      {
        seat: "Chair",
        vote: "Aye"
      },
      {
        seat: "Vice Chair",
        vote: "Aye"
      },
      {
        seat: "Member 3",
        vote: "Aye"
      },
      {
        seat: "Member 4",
        vote: "No"
      },
      {
        seat: "Member 5",
        vote: "Aye"
      },
      {
        seat: "Member 6",
        vote: "Aye"
      },
      {
        seat: "Member 7",
        vote: "Aye"
      }
    ],
    moments: [
      {
        t: "0:18:02",
        q: "Staff presentation on the access road alignment."
      },
      {
        t: "1:40:15",
        q: "Kīhei parents testify on school-hour traffic."
      },
      {
        t: "2:51:00",
        q: "Vote on the SMA permit."
      }
    ]
  },
  {
    id: "m3",
    mon: "Sep",
    day: "25",
    date: "Thu, Sep 25, 2026",
    body: "Board of Water Supply",
    dur: "2 h 20 m",
    voteCount: 1,
    voteItem: "Lahaina system restoration timeline",
    ayes: 5,
    noes: 0,
    summary: "Lahaina water system restoration timeline moved to Q2 2027. Upcountry meter waitlist update.",
    recap: "The Board accepted the Department's revised Lahaina water system restoration timeline, now targeting Q2 2027 for full service to the Wahikuli and Kelawea neighborhoods.[[1:02:14]] Staff reported 1,412 households remain on the Upcountry meter waitlist.[[1:48:30]] No public testimony.[[2:12:05]]",
    decided: [
      "Revised Lahaina restoration timeline (Q2 2027) accepted, 5–0.",
      "Upcountry meter waitlist report received."
    ],
    next: "Department returns Oct 23 with the Wahikuli pressure-zone bid results.",
    votes: [
      {
        seat: "Chair",
        vote: "Aye"
      },
      {
        seat: "Vice Chair",
        vote: "Aye"
      },
      {
        seat: "Member 3",
        vote: "Aye"
      },
      {
        seat: "Member 4",
        vote: "Aye"
      },
      {
        seat: "Member 5",
        vote: "Aye"
      }
    ],
    moments: [
      {
        t: "0:09:40",
        q: "Director presents the revised Lahaina timeline."
      },
      {
        t: "1:02:14",
        q: "“Lahaina water service to Wahikuli is now targeted for the second quarter of 2027.”"
      },
      {
        t: "1:48:30",
        q: "Upcountry meter waitlist: 1,412 households."
      }
    ]
  }
];

export const HITS: TranscriptHit[] = [
  {
    mid: "m3",
    meeting: "Board of Water Supply · Sep 25",
    time: "1:02:14",
    quote: "Lahaina water service to Wahikuli is now targeted for the second quarter of 2027.",
    speaker: "Director, Dept. of Water Supply"
  },
  {
    mid: "m1",
    meeting: "County Council · Oct 2",
    time: "3:15:48",
    quote: "Lahaina water infrastructure has to come before any new permits in the burn zone.",
    speaker: "Public testimony, Lahaina resident"
  },
  {
    mid: "m1",
    meeting: "County Council · Oct 2",
    time: "4:21:05",
    quote: "We asked the Water Department for a written Lahaina timeline. We have it now. Q2 2027.",
    speaker: "Councilmember, West Maui"
  }
];
