// Demo content ported from the Claude Design prototype (Akaku Screen.dc.html).
// County releases and Maui Recovers links are real; meeting quotes, votes and
// follow-ups are illustrative until Akakū Intelligence is wired in.
import type { CalDay, CalEvent, Explainer, FollowUp, FollowUpStatus, Issue, Topic, WeeklyBrief } from './types';

export const ISSUES: Record<string, Issue> = {
  "Storm recovery": {
    since: "Aug 8",
    oneLine: "Three years on, the County just added a human guide for survivors — and FEMA rent is about to rise.",
    why: "If you or someone you know is still in temporary housing, two things changed this week: there's a Navigator to call, and your rent number is changing. Both are in writing below.",
    deadlines: [
      {
        d: "Oct 7",
        t: "Lahaina Community Meeting (in person)"
      },
      {
        d: "Monthly",
        t: "FEMA fact sheet · first week"
      }
    ],
    next: "The Oct 7 Lahaina Community Meeting is the next place to ask about both programs in person. The next FEMA monthly fact sheet lands early November.",
    brief: "The County of Maui launched a Housing Navigator Program on Oct 1 for households impacted by the 2023 wildfires — a single point of contact for housing options.[[#1]] Four days later it published an FAQ on the upcoming rent increase for survivors living in FEMA temporary housing units.[[#2]] FEMA's own October fact sheet summarises where federal recovery money stands.[[#3]] Commercial rebuilding has its own track: the third Commercial Property Workshop ran Sep 30, with video and slides posted.[[#4]] The in-person Lahaina Community Meeting is Oct 7.[[#5]]",
    timeline: [
      {
        mon: "Oct",
        day: "5",
        source: "County · Maui Recovers",
        kind: "county",
        title: "FAQ: upcoming rent increase for survivors in FEMA temporary housing",
        note: "Who is affected, how much, and when notices go out.",
        proof: "mauirecovers.org · Oct 5, 2026",
        href: "https://www.mauirecovers.org/news/faq-upcoming-rent-increase-for-maui-wildfire-survivors-living-in-fema-temporary-housing-units"
      },
      {
        mon: "Oct",
        day: "5",
        source: "FEMA · via Maui Recovers",
        kind: "county",
        title: "FEMA Monthly Maui Wildfires Recovery Fact Sheet — October 2026",
        note: "Federal dollars obligated, households assisted, programs still open.",
        proof: "mauirecovers.org · Oct 5, 2026",
        href: "https://www.mauirecovers.org/news/fema-monthly-maui-wildfires-recovery-fact-sheet-october-2026"
      },
      {
        mon: "Oct",
        day: "1",
        source: "County · Maui Recovers",
        kind: "county",
        title: "Housing Navigator Program announced for wildfire-impacted households",
        note: "One navigator per household to work through rebuild, rental and ownership options.",
        proof: "mauirecovers.org · Oct 1, 2026",
        href: "https://www.mauirecovers.org/news/county-of-maui-announces-housing-navigator-program-for-wildfire-impacted-households"
      },
      {
        mon: "Sep",
        day: "30",
        source: "County · Office of Recovery",
        kind: "county",
        title: "Commercial Property Workshop #3 — video and slides posted",
        note: "Permitting path for Lahaina businesses rebuilding.",
        proof: "intercom.help/mauirecovers",
        href: "https://intercom.help/mauirecovers/en/articles/17084776-commercial-permitting-workshop-for-lahaina-businesses-on-september-30-2026"
      }
    ],
    sources: [
      {
        n: 1,
        title: "County of Maui announces Housing Navigator Program for Wildfire-Impacted Households",
        where: "Maui Recovers · County news release · Oct 1, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/county-of-maui-announces-housing-navigator-program-for-wildfire-impacted-households"
      },
      {
        n: 2,
        title: "FAQ: Upcoming Rent Increase for Maui Wildfire Survivors Living in FEMA Temporary Housing Units",
        where: "Maui Recovers · Oct 5, 2026",
        cta: "Read the FAQ →",
        href: "https://www.mauirecovers.org/news/faq-upcoming-rent-increase-for-maui-wildfire-survivors-living-in-fema-temporary-housing-units"
      },
      {
        n: 3,
        title: "FEMA Monthly Maui Wildfires Recovery Fact Sheet — October 2026",
        where: "Maui Recovers · Oct 5, 2026",
        cta: "Open the fact sheet →",
        href: "https://www.mauirecovers.org/news/fema-monthly-maui-wildfires-recovery-fact-sheet-october-2026"
      },
      {
        n: 4,
        title: "Commercial Permitting Workshop for Lahaina Businesses — Sep 30, 2026 (video + slides)",
        where: "Maui Recovers help center",
        cta: "Watch the workshop →",
        href: "https://intercom.help/mauirecovers/en/articles/17084776-commercial-permitting-workshop-for-lahaina-businesses-on-september-30-2026"
      },
      {
        n: 5,
        title: "County's in-person Lahaina Community Meeting — Oct 7, 2026",
        where: "County meetings calendar",
        cta: "Event details →",
        href: "https://countymeetings.eventcalendarapp.com/countys-in-person-lahaina-community-meeting-14"
      }
    ]
  },
  "Grants & funding": {
    since: "Sep 10",
    oneLine: "Two County grant doors are open right now, and the rules for all future grants are up for public comment.",
    why: "If you farm, run a nonprofit or a small business, there is money on the table this month — and a chance to shape how it's handed out for years.",
    deadlines: [
      {
        d: "Open",
        t: "Niu, Kalo, ʻUlu grants"
      },
      {
        d: "Open",
        t: "FY2028 Affordable Housing Fund"
      },
      {
        d: "Comment",
        t: "Countywide grant rules"
      }
    ],
    next: "Watch for the public-comment deadline on the grant administration rules and the FY2028 Affordable Housing Fund application close. Both will be flagged here the day they're posted.",
    brief: "The County is asking for public input on new Countywide grant administration rules — the framework every future grant will follow.[[#1]] The Department of Agriculture launched a Niu, Kalo, ʻUlu grant program on Sep 18,[[#2]] the same day the Mayor signed the County Food and Nutrition Security Plan into law.[[#3]] The Department of Housing is taking applications for FY2028 Affordable Housing Fund projects.[[#4]] Deadlines for the Economic Revitalization and Public Services grant programs were extended in September.[[#5]]",
    timeline: [
      {
        mon: "Sep",
        day: "30",
        source: "County · Maui Recovers",
        kind: "county",
        title: "County seeks public input on new Countywide grant administration rules",
        note: "How every County grant will be applied for, scored and reported.",
        proof: "mauirecovers.org · Sep 30, 2026",
        href: "https://www.mauirecovers.org/news/county-seeks-public-input-on-new-countywide-grant-administration-rules"
      },
      {
        mon: "Sep",
        day: "18",
        source: "County · Dept. of Agriculture",
        kind: "county",
        title: "Niu, Kalo, ʻUlu Grant program launched",
        note: "Funding for growers of the three staple crops.",
        proof: "mauirecovers.org · Sep 18, 2026",
        href: "https://www.mauirecovers.org/news/county-department-of-agriculture-launches-niu-kalo-ulu-grant-program"
      },
      {
        mon: "Sep",
        day: "18",
        source: "Mayor's Office",
        kind: "county",
        title: "Food and Nutrition Security Plan signed into law",
        note: "Sets the policy the ag grants now serve.",
        proof: "mauirecovers.org · Sep 18, 2026",
        href: "https://www.mauirecovers.org/news/mayor-bissen-signs-county-food-and-nutrition-security-plan-into-law"
      },
      {
        mon: "Sep",
        day: "10",
        source: "County · Dept. of Housing",
        kind: "county",
        title: "Applications open: FY2028 Affordable Housing Fund projects",
        note: "For developers and nonprofits building affordable units.",
        proof: "mauirecovers.org · Sep 10, 2026",
        href: "https://www.mauirecovers.org/news/county-department-of-housing-seeks-applications-for-fy-2028-affordable-housing-fund-projects"
      }
    ],
    sources: [
      {
        n: 1,
        title: "County seeks public input on new Countywide grant administration rules",
        where: "Maui Recovers · Sep 30, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/county-seeks-public-input-on-new-countywide-grant-administration-rules"
      },
      {
        n: 2,
        title: "County Department of Agriculture launches Niu, Kalo, ʻUlu Grant program",
        where: "Maui Recovers · Sep 18, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/county-department-of-agriculture-launches-niu-kalo-ulu-grant-program"
      },
      {
        n: 3,
        title: "Mayor Bissen signs County Food and Nutrition Security Plan into law",
        where: "Maui Recovers · Sep 18, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/mayor-bissen-signs-county-food-and-nutrition-security-plan-into-law"
      },
      {
        n: 4,
        title: "County Department of Housing seeks applications for FY 2028 Affordable Housing Fund projects",
        where: "Maui Recovers · Sep 10, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/county-department-of-housing-seeks-applications-for-fy-2028-affordable-housing-fund-projects"
      },
      {
        n: 5,
        title: "Application deadline extended for County Economic Revitalization and Public Services grant programs",
        where: "Maui Recovers · Sep 9, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/application-deadline-extended-for-county-economic-revitalization-and-public-services-grant-programs"
      }
    ]
  },
  "Culture & ʻāina": {
    since: "Jul 30",
    oneLine: "The County is putting money behind Hawaiian culture and food sovereignty — grants, a marketplace and a plan now in law.",
    why: "Practitioners, growers and hālau: the ʻŌiwi Resources grant window and the Niu-Kalo-ʻUlu program are built for you.",
    deadlines: [
      {
        d: "Open",
        t: "Niu, Kalo, ʻUlu grants"
      }
    ],
    next: "ʻUlu O Lele Marketplace vendor selections and the next ʻŌiwi Resources grant round will be flagged here.",
    brief: "The Department of ʻŌiwi Resources took grant applications Jul 31–Aug 31.[[#1]] Hawaiian Council opened vendor applications for the ʻUlu O Lele Marketplace in Lahaina.[[#2]] On Sep 18 the Mayor signed the County Food and Nutrition Security Plan into law and the Department of Agriculture launched the Niu, Kalo, ʻUlu grant program.[[#3]]",
    timeline: [
      {
        mon: "Sep",
        day: "18",
        source: "County · Dept. of Agriculture",
        kind: "county",
        title: "Niu, Kalo, ʻUlu Grant program launched",
        note: "Funding for coconut, taro and breadfruit growers.",
        proof: "mauirecovers.org · Sep 18, 2026",
        href: "https://www.mauirecovers.org/news/county-department-of-agriculture-launches-niu-kalo-ulu-grant-program"
      },
      {
        mon: "Sep",
        day: "14",
        source: "Hawaiian Council · via Maui Recovers",
        kind: "county",
        title: "ʻUlu O Lele Marketplace vendor applications open",
        note: "Lahaina marketplace for local makers.",
        proof: "mauirecovers.org · Sep 14, 2026",
        href: "https://www.mauirecovers.org/news/hawaiian-council-opens-vendor-applications-for-ulu-o-lele-marketplace-in-lahaina"
      },
      {
        mon: "Jul",
        day: "30",
        source: "County · Dept. of ʻŌiwi Resources",
        kind: "county",
        title: "Grant applications accepted Jul 31 – Aug 31",
        note: "Cultural practitioners and organizations.",
        proof: "mauirecovers.org · Jul 30, 2026",
        href: "https://www.mauirecovers.org/news/county-department-of-oiwi-resources-grant-applications-to-be-accepted-july-31-aug-31-2026"
      }
    ],
    sources: [
      {
        n: 1,
        title: "County Department of ʻŌiwi Resources grant applications to be accepted July 31–Aug. 31, 2026",
        where: "Maui Recovers · Jul 30, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/county-department-of-oiwi-resources-grant-applications-to-be-accepted-july-31-aug-31-2026"
      },
      {
        n: 2,
        title: "Hawaiian Council opens vendor applications for ʻUlu O Lele Marketplace in Lahaina",
        where: "Maui Recovers · Sep 14, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/hawaiian-council-opens-vendor-applications-for-ulu-o-lele-marketplace-in-lahaina"
      },
      {
        n: 3,
        title: "Mayor Bissen signs County Food and Nutrition Security Plan into law",
        where: "Maui Recovers · Sep 18, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/mayor-bissen-signs-county-food-and-nutrition-security-plan-into-law"
      }
    ]
  },
  Events: {
    since: "Today",
    oneLine: "Three County gatherings this week where decisions get explained face to face.",
    why: "Showing up still works. These are the rooms where staff answer questions on the record.",
    deadlines: [
      {
        d: "Oct 7",
        t: "Lahaina Community Meeting"
      },
      {
        d: "Oct 9",
        t: "Council, 9 AM · live on 53"
      }
    ],
    next: "SMA boundary meetings continue around the island; the Council meets Oct 9 and Oct 16.",
    brief: "The County's in-person Lahaina Community Meeting is Oct 7.[[#1]] The Planning Department is holding public meetings in East Maui, the North Shore and South Maui on the Special Management Area boundary.[[#2]] The 99th Maui County Fair ran Oct 1–4.[[#3]]",
    timeline: [
      {
        mon: "Oct",
        day: "7",
        source: "County · Office of Recovery",
        kind: "county",
        title: "Lahaina Community Meeting (in person)",
        note: "Recovery staff, Q&A.",
        proof: "countymeetings.eventcalendarapp.com",
        href: "https://countymeetings.eventcalendarapp.com/countys-in-person-lahaina-community-meeting-14"
      },
      {
        mon: "Sep",
        day: "29",
        source: "County · Planning Dept.",
        kind: "county",
        title: "SMA boundary public meetings — East Maui, North Shore, South Maui",
        note: "Where the coastal zone line should sit.",
        proof: "mauirecovers.org · Sep 29, 2026",
        href: "https://www.mauirecovers.org/news/reminder-county-planning-department-to-hold-public-meetings-in-east-maui-north-shore-south-maui-for-assessment-of-special-management-area-boundary-for-the-island-of-maui"
      },
      {
        mon: "Oct",
        day: "2",
        source: "County · Maui Recovers",
        kind: "county",
        title: "99th Maui County Fair draws thousands on opening night",
        note: "Oct 1–4, War Memorial complex.",
        proof: "mauirecovers.org · Oct 2, 2026",
        href: "https://mauirecovers.org/news/99th-maui-county-fair-draws-thousands-on-opening-night"
      }
    ],
    sources: [
      {
        n: 1,
        title: "County's in-person Lahaina Community Meeting — Oct 7, 2026",
        where: "County meetings calendar",
        cta: "Event details →",
        href: "https://countymeetings.eventcalendarapp.com/countys-in-person-lahaina-community-meeting-14"
      },
      {
        n: 2,
        title: "Planning Department public meetings on the SMA boundary for the island of Maui",
        where: "Maui Recovers · Sep 29, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/reminder-county-planning-department-to-hold-public-meetings-in-east-maui-north-shore-south-maui-for-assessment-of-special-management-area-boundary-for-the-island-of-maui"
      },
      {
        n: 3,
        title: "99th Maui County Fair draws thousands on opening night",
        where: "Maui Recovers · Oct 2, 2026",
        cta: "Read the release →",
        href: "https://mauirecovers.org/news/99th-maui-county-fair-draws-thousands-on-opening-night"
      }
    ]
  },
  "Lahaina water": {
    since: "Jul 22",
    oneLine: "Lahaina gets full water service back in Q2 2027 — that date is now official, on the record twice.",
    why: "If you're rebuilding in Wahikuli or Kelawea, this is the date your plans hang on. We'll flag the day it moves.",
    deadlines: [
      {
        d: "Oct 9",
        t: "Council item 9 · funding plan"
      },
      {
        d: "Oct 23",
        t: "Board of Water Supply · bids"
      }
    ],
    next: "Council item 9 on Fri, Oct 9 asks the Department for the Wahikuli pressure-zone funding plan. Bid results are due at the Board of Water Supply on Oct 23. Watch it live on Channel 53.",
    brief: "Full water service to Wahikuli and Kelawea is now officially targeted for Q2 2027 — the Department presented the revised timeline to the Board of Water Supply on Sep 25 and the Board accepted it 5–0.[[#1]] A week later the Council heard it repeated on the record, with the West Maui seat confirming the written timeline had been received.[[#2]] The County's own channels have been quieter: Maui Recovers still lists the Wahikuli Sewer Project and water-meter installation as active recovery projects without a completion date,[[#3]] and the last water advisory for West Maui was the post-Lala conservation notice in August.[[#4]] Desalination for West Maui was floated at DWS community meetings in July and has not come back to a public body since.[[#5]]",
    timeline: [
      {
        mon: "Oct",
        day: "2",
        source: "Council · Ch 53",
        kind: "tv",
        title: "Lahaina timeline read into the Council record",
        note: "West Maui seat: \"We asked the Water Department for a written Lahaina timeline. We have it now. Q2 2027.\"",
        proof: "▶ 4:21:05 in the recording",
        view: {
          type: "meeting",
          id: "m1"
        },
        seek: "4:21:05"
      },
      {
        mon: "Sep",
        day: "25",
        source: "Board of Water Supply · Ch 53",
        kind: "tv",
        title: "Revised restoration timeline accepted, 5–0",
        note: "Full service to Wahikuli and Kelawea targeted for Q2 2027. 1,412 households remain on the Upcountry meter waitlist.",
        proof: "▶ 1:02:14 in the recording",
        view: {
          type: "meeting",
          id: "m3"
        },
        seek: "1:02:14"
      },
      {
        mon: "Aug",
        day: "17",
        source: "County · Maui Recovers",
        kind: "county",
        title: "DWS advises water conservation in West Maui after Tropical Storm Lala",
        note: "Advisory issued while Lahaina system repairs were ongoing.",
        proof: "mauirecovers.org · Aug 17, 2026",
        href: "https://www.mauirecovers.org/news/dws-advising-water-conservation-in-west-maui-following-tropical-storm-lala"
      },
      {
        mon: "Jul",
        day: "22",
        source: "County · Maui Recovers",
        kind: "county",
        title: "DWS community meetings on West Maui and South Maui desalination options",
        note: "Public invited to weigh in on desalination facilities as a long-term supply option.",
        proof: "mauirecovers.org · Jul 22, 2026",
        href: "https://www.mauirecovers.org/news/community-invited-to-dws-meetings-on-options-for-south-maui-west-maui-desalination-facilities"
      }
    ],
    sources: [
      {
        n: 1,
        title: "Board of Water Supply meeting, Sep 25, 2026 — Director's presentation and vote",
        where: "Akakū Channel 53 recording · 1:02:14",
        cta: "Watch the moment →",
        view: {
          type: "meeting",
          id: "m3"
        },
        seek: "1:02:14"
      },
      {
        n: 2,
        title: "Maui County Council meeting, Oct 2, 2026 — councilmember remarks",
        where: "Akakū Channel 53 recording · 4:21:05",
        cta: "Watch the moment →",
        view: {
          type: "meeting",
          id: "m1"
        },
        seek: "4:21:05"
      },
      {
        n: 3,
        title: "Wahikuli Sewer Project; Water Meter Installation",
        where: "Maui Recovers · recovery project pages",
        cta: "Open mauirecovers.org →",
        href: "https://www.mauirecovers.org/wahikulisewerproject"
      },
      {
        n: 4,
        title: "DWS advising water conservation in West Maui following Tropical Storm Lala",
        where: "Maui Recovers · County news release · Aug 17, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/dws-advising-water-conservation-in-west-maui-following-tropical-storm-lala"
      },
      {
        n: 5,
        title: "Community invited to DWS meetings on options for South Maui, West Maui desalination facilities",
        where: "Maui Recovers · County news release · Jul 22, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/community-invited-to-dws-meetings-on-options-for-south-maui-west-maui-desalination-facilities"
      }
    ]
  },
  "Short-term rentals": {
    since: "Sep 14",
    oneLine: "The phase-out vote slipped to Oct 16. 48 people testified; the Council blinked.",
    why: "Whether you own one, rent near one or work in one — the Oct 16 reading is where the real numbers land.",
    deadlines: [
      {
        d: "Oct 16",
        t: "Amendment returns to Council"
      }
    ],
    next: "Deferred amendment returns to Council on Oct 16. Live on Channel 53.",
    brief: "The phase-out amendment for short-term rentals on the Minatoya list was deferred to October 16 after 48 of the 61 testifiers on Oct 2 spoke to it.[[#1]] The Mayor's FY2028 community budget meetings, announced Sep 14, are the other venue where the rental tax base is being discussed.[[#2]]",
    timeline: [
      {
        mon: "Oct",
        day: "2",
        source: "Council · Ch 53",
        kind: "tv",
        title: "Phase-out amendment deferred to Oct 16",
        note: "48 testifiers on the item; 2 h 40 m of testimony.",
        proof: "▶ 0:42:10 in the recording",
        view: {
          type: "meeting",
          id: "m1"
        },
        seek: "0:42:10"
      },
      {
        mon: "Sep",
        day: "14",
        source: "County · Maui Recovers",
        kind: "county",
        title: "Mayor hosting community budget meetings for FY2028",
        note: "Budget meetings are where the rental tax revenue question surfaces.",
        proof: "mauirecovers.org · Sep 14, 2026",
        href: "https://www.mauirecovers.org/news/mayor-bissen-hosting-community-budget-meetings-for-fiscal-year-2028"
      }
    ],
    sources: [
      {
        n: 1,
        title: "Maui County Council meeting, Oct 2, 2026 — public testimony and deferral",
        where: "Akakū Channel 53 recording · 0:42:10",
        cta: "Watch the moment →",
        view: {
          type: "meeting",
          id: "m1"
        },
        seek: "0:42:10"
      },
      {
        n: 2,
        title: "Mayor Bissen hosting community budget meetings for Fiscal Year 2028",
        where: "Maui Recovers · County news release · Sep 14, 2026",
        cta: "Read the release →",
        href: "https://www.mauirecovers.org/news/mayor-bissen-hosting-community-budget-meetings-for-fiscal-year-2028"
      }
    ]
  }
};
// The Water topic opens the Lahaina water record.
ISSUES['Water'] = ISSUES['Lahaina water'];

export const EMPTY_ISSUE: Issue = {
  since: "Today",
  oneLine: "Tracking started. Nothing on the record yet.",
  why: "The first time this comes up in a meeting or County release, it appears here with its source.",
  deadlines: [],
  next: "Nothing scheduled yet. You'll get an alert the first time this comes up in any meeting or County release.",
  brief: "Tracking started. No developments yet — the first mention in a Council, board or commission meeting, or a County of Maui release, will appear here with its source.",
  timeline: [],
  sources: []
};

export const WEEKLY: WeeklyBrief = {
  headline: "Housing help launched, a rent hike explained, and the rental vote slipped two weeks.",
  items: [
    {
      tag: "Housing",
      kind: "county",
      title: "The County opened a Housing Navigator Program for wildfire-impacted households.",
      why: "If you lost housing in 2023, there is now one person whose job is to walk you through every option. Announced Oct 1.",
      proof: "mauirecovers.org · Oct 1",
      issue: "Storm recovery"
    },
    {
      tag: "Money",
      kind: "county",
      title: "FEMA temporary-housing rent is going up — the County published a plain FAQ.",
      why: "Affects every survivor still in a FEMA unit. Know the number before the notice arrives. Posted Oct 5.",
      proof: "mauirecovers.org · Oct 5",
      issue: "Storm recovery"
    },
    {
      tag: "Council",
      kind: "tv",
      title: "The short-term rental phase-out vote was pushed to Oct 16 after 48 people testified.",
      why: "Two more weeks to understand what's actually in the amendment. The transcript has every word.",
      proof: "▶ Council · Oct 2 · 0:42:10",
      issue: "Short-term rentals"
    }
  ],
  deadlines: [
    {
      d: "Oct 7",
      t: "Lahaina Community Meeting"
    },
    {
      d: "Oct 9",
      t: "Council · 23 items · live on 53"
    },
    {
      d: "Oct 16",
      t: "Rental amendment returns"
    }
  ]
};

export const TOPICS: Topic[] = [
  {
    name: "Storm recovery",
    sub: "Wildfire + Kona storm programs, FEMA, rebuild",
    badge: "4 new this week"
  },
  {
    name: "Grants & funding",
    sub: "Money the County is giving out, and to whom",
    badge: "2 open now"
  },
  {
    name: "Water",
    sub: "Lahaina system, Upcountry meters, desal",
    badge: "1 new"
  },
  {
    name: "Housing",
    sub: "Permits, ADUs, affordable housing fund",
    badge: "3 new"
  },
  {
    name: "Culture & ʻāina",
    sub: "ʻŌiwi Resources, Niu-Kalo-ʻUlu, food plan",
    badge: "2 new"
  },
  {
    name: "Events",
    sub: "Community meetings, fairs, workshops",
    badge: "This week: 3"
  }
];

export const EXPLAINERS: Explainer[] = [
  {
    id: "permits",
    tag: "Housing · Permits",
    q: "Why do building permits take so long?",
    basis: "212 meetings · 2012–2026",
    meetings: 212,
    short: "Not one cause — four, stacked. Staffing never recovered after 2009, the code review itself has to be done by hand against three overlapping plans, the fire tripled the queue overnight, and until 2024 nobody was measuring how long it took.",
    reasons: [
      {
        pct: "38%",
        title: "Not enough plan reviewers — for 15 years",
        text: "The Department of Public Works has asked for reviewer positions in almost every budget since 2012; most years the Council funded a fraction.[[#1]] In 2023 the Director said the division was reviewing with \"the same headcount as 2008 and three times the applications.\"[[#2]]"
      },
      {
        pct: "27%",
        title: "Three plans, one application",
        text: "A single permit can need sign-off against the Community Plan, the Maui Island Plan and SMA rules — each with its own body. Planning Commission members themselves called it \"a loop with no owner\" in 2019.[[#3]]"
      },
      {
        pct: "21%",
        title: "The fire tripled the line",
        text: "After August 2023 the Office of Recovery was created to expedite Lahaina rebuilds — and routine permits island-wide slowed as reviewers moved over.[[#4]] The 2026 ADU rules were passed partly to take pressure off the queue.[[#5]]"
      },
      {
        pct: "14%",
        title: "Nobody was counting until 2024",
        text: "The first public permit-timeline dashboard was requested by the Council in 2024; before that, \"how long\" was answered anecdotally at every budget hearing.[[#6]]"
      }
    ],
    history: [
      {
        year: "2012",
        what: "Budget: 4 reviewer positions requested, 1 funded.",
        src: "Budget & Finance Committee · Apr 2012",
        mid: "m1",
        seek: "0:03:12"
      },
      {
        year: "2019",
        what: "Planning Commission: \"a loop with no owner.\"",
        src: "Maui Planning Commission · Jun 2019",
        mid: "m2",
        seek: "0:06:20"
      },
      {
        year: "2023",
        what: "DPW Director: same headcount as 2008, 3× applications.",
        src: "Council · Budget hearing · Apr 2023",
        mid: "m1",
        seek: "0:03:12"
      },
      {
        year: "2023",
        what: "Office of Recovery created to expedite Lahaina permits.",
        src: "Council · Sep 2023",
        mid: "m1",
        seek: "0:03:12"
      },
      {
        year: "2026",
        what: "New accessory dwelling rules adopted to relieve the queue.",
        src: "County release · Jul 16, 2026",
        href: "https://www.mauirecovers.org/news/county-of-maui-adopts-new-accessory-dwelling-rules-to-expand-housing-opportunities"
      }
    ],
    who: "Department of Public Works (reviews), Planning Department (zoning/SMA), Council (budget for staff).",
    lever: "Fund the reviewer positions in the FY2028 budget — hearings start in spring. The Mayor's community budget meetings are the first door.",
    sources: [
      {
        n: 1,
        title: "Budget & Finance Committee — DPW position requests, 2012–2025 (14 hearings)",
        where: "Akakū Ch 53 archive",
        mid: "m1",
        seek: "0:03:12"
      },
      {
        n: 2,
        title: "Council budget hearing — DPW Director testimony, Apr 2023",
        where: "Akakū Ch 53 recording",
        mid: "m1",
        seek: "0:03:12"
      },
      {
        n: 3,
        title: "Maui Planning Commission — SMA/Community Plan discussion, Jun 2019",
        where: "Akakū Ch 53 recording",
        mid: "m2",
        seek: "0:06:20"
      },
      {
        n: 4,
        title: "Council — creation of the Office of Recovery, Sep 2023",
        where: "Akakū Ch 53 recording",
        mid: "m1",
        seek: "0:03:12"
      },
      {
        n: 5,
        title: "County of Maui adopts new accessory dwelling rules to expand housing opportunities",
        where: "Maui Recovers · Jul 16, 2026",
        href: "https://www.mauirecovers.org/news/county-of-maui-adopts-new-accessory-dwelling-rules-to-expand-housing-opportunities"
      },
      {
        n: 6,
        title: "Council — request for a permit-timeline dashboard, 2024",
        where: "Akakū Ch 53 recording",
        mid: "m1",
        seek: "0:03:12"
      }
    ]
  },
  {
    id: "cost",
    tag: "Cost of living",
    q: "Why is everything so expensive here?",
    basis: "147 meetings · 2012–2026",
    meetings: 147,
    short: "The County controls less than people think — but what it does control (property tax classes, short-term rental supply, water and permit timelines) shows up in your rent and your grocery bill. Shipping and land cost are the rest.",
    reasons: [
      {
        pct: "41%",
        title: "Housing supply vs. visitor units",
        text: "Roughly one in seven Maui homes is a legal or grandfathered vacation rental. The Council has debated the Minatoya-list phase-out since 2014; the current amendment returns Oct 16.[[#1]]"
      },
      {
        pct: "24%",
        title: "Everything arrives by barge",
        text: "Harbor capacity and the Jones Act come up in nearly every Economic Development hearing; the County Ferry Program meetings in 2026 are the latest attempt at a local lever.[[#2]]"
      },
      {
        pct: "20%",
        title: "Property tax design",
        text: "Owner-occupied rates have been held low by shifting the burden to non-resident and visitor classes — which landlords pass through as rent.[[#3]]"
      },
      {
        pct: "15%",
        title: "Slow permits = scarce homes",
        text: "Every year a permit sits is a year a home isn't on the market. See the permits explainer.[[#4]]"
      }
    ],
    history: [
      {
        year: "2014",
        what: "First Council hearing on phasing out Minatoya-list rentals.",
        src: "Council · 2014",
        mid: "m1",
        seek: "0:42:10"
      },
      {
        year: "2022",
        what: "Property tax tiers restructured toward visitor classes.",
        src: "Budget Committee · 2022",
        mid: "m1",
        seek: "5:40:19"
      },
      {
        year: "2026",
        what: "Ferry Program community meetings; rental phase-out amendment deferred to Oct 16.",
        src: "County release · Aug 25; Council · Oct 2",
        mid: "m1",
        seek: "0:42:10"
      }
    ],
    who: "Council (tax classes, rental zoning), State (harbors, Jones Act is federal), Water Supply (meter waitlist).",
    lever: "The Oct 16 rental vote and the FY2028 property-tax rates are the two County decisions this year with the biggest effect on what you pay.",
    sources: [
      {
        n: 1,
        title: "Council — short-term rental phase-out amendment, Oct 2, 2026 (and 11 prior hearings since 2014)",
        where: "Akakū Ch 53 recording · 0:42:10",
        mid: "m1",
        seek: "0:42:10"
      },
      {
        n: 2,
        title: "County of Maui Ferry Program to hold four community meetings",
        where: "Maui Recovers · Aug 25, 2026",
        href: "https://www.mauirecovers.org/news/county-of-maui-ferry-program-to-hold-four-community-meetings-next-month"
      },
      {
        n: 3,
        title: "Budget Committee — real property tax classification, 2022",
        where: "Akakū Ch 53 recording",
        mid: "m1",
        seek: "5:40:19"
      },
      {
        n: 4,
        title: "Explainer: Why do building permits take so long?",
        where: "County Watch",
        ex: "permits"
      }
    ]
  },
  {
    id: "firemoney",
    tag: "Storm recovery",
    q: "Where did the wildfire money go?",
    basis: "96 meetings · 2023–2026",
    meetings: 96,
    short: "Three pots — FEMA, State, and County — each with its own rules and its own meeting. Most of the federal money is obligated to housing and debris; the County's share runs through the Office of Recovery and shows up in the monthly fact sheets.",
    reasons: [
      {
        pct: "52%",
        title: "FEMA: housing and debris first",
        text: "Federal dollars are tracked monthly in the FEMA fact sheet the County republishes.[[#1]] Debris removal and temporary housing are the two largest lines."
      },
      {
        pct: "31%",
        title: "County: the Office of Recovery",
        text: "Created Sep 2023; its budget and programs (reconstruction, reimbursement, navigators) are reviewed at Council each budget cycle.[[#2]]"
      },
      {
        pct: "17%",
        title: "State: grid and hazard mitigation",
        text: "Hawaiʻi received $18.5M for grid resilience in Aug 2026; the State's disaster case management moved to the County the same month.[[#3]]"
      }
    ],
    history: [
      {
        year: "2023",
        what: "Office of Recovery created.",
        src: "Council · Sep 2023",
        mid: "m1",
        seek: "0:03:12"
      },
      {
        year: "2026",
        what: "Case management moves State → County; $18.5M grid grant; eligibility expanded for reconstruction programs.",
        src: "County releases · Aug 2026",
        href: "https://www.mauirecovers.org/news/governor-green-mayor-bissen-announce-wildfires-disaster-case-management-program-move-from-state-to-county"
      }
    ],
    who: "FEMA (federal), Governor's office (State), Office of Recovery + Council (County).",
    lever: "Every FEMA fact sheet and every Office of Recovery budget hearing is tracked here under Storm recovery.",
    sources: [
      {
        n: 1,
        title: "FEMA Monthly Maui Wildfires Recovery Fact Sheet — October 2026",
        where: "Maui Recovers · Oct 5, 2026",
        href: "https://www.mauirecovers.org/news/fema-monthly-maui-wildfires-recovery-fact-sheet-october-2026"
      },
      {
        n: 2,
        title: "Council — Office of Recovery budget review",
        where: "Akakū Ch 53 recording",
        mid: "m1",
        seek: "0:03:12"
      },
      {
        n: 3,
        title: "Governor Green, Mayor Bissen announce wildfires disaster case management program move from state to county",
        where: "Maui Recovers · Aug 10, 2026",
        href: "https://www.mauirecovers.org/news/governor-green-mayor-bissen-announce-wildfires-disaster-case-management-program-move-from-state-to-county"
      }
    ]
  },
  {
    id: "meters",
    tag: "Water",
    q: "Why is there a water-meter waitlist Upcountry?",
    basis: "61 meetings · 2012–2026",
    meetings: 61,
    short: "Source, not pipe. Upcountry depends on surface water that drops in drought; the Department won't issue meters it can't guarantee. 1,412 households are waiting as of Sep 25.",
    reasons: [
      {
        pct: "58%",
        title: "Not enough reliable source",
        text: "The Board of Water Supply has heard the same line since 2012: new meters need new source — wells or storage — and both take a decade.[[#1]]"
      },
      {
        pct: "42%",
        title: "Priority list rules",
        text: "The 2015 ordinance set who gets the next meter; changing it has been proposed three times.[[#2]]"
      }
    ],
    history: [
      {
        year: "2015",
        what: "Upcountry meter priority ordinance adopted.",
        src: "Council · 2015",
        mid: "m3",
        seek: "1:48:30"
      },
      {
        year: "2026",
        what: "1,412 households on the list; desalination meetings for South and West Maui.",
        src: "Board of Water Supply · Sep 25; County release · Jul 22",
        mid: "m3",
        seek: "1:48:30"
      }
    ],
    who: "Department and Board of Water Supply; Council for the ordinance.",
    lever: "Source projects in the Water Supply capital budget — and whether desalination comes back to a public body.",
    sources: [
      {
        n: 1,
        title: "Board of Water Supply — Upcountry meter waitlist report, Sep 25, 2026",
        where: "Akakū Ch 53 recording · 1:48:30",
        mid: "m3",
        seek: "1:48:30"
      },
      {
        n: 2,
        title: "Council — Upcountry meter priority ordinance and proposed amendments",
        where: "Akakū Ch 53 archive",
        mid: "m3",
        seek: "1:48:30"
      }
    ]
  }
];

export const CAL_DAYS: CalDay[] = [
  {
    dow: "Mon",
    num: 5,
    key: 5
  },
  {
    dow: "Tue",
    num: 6,
    key: 6
  },
  {
    dow: "Wed",
    num: 7,
    key: 7
  },
  {
    dow: "Thu",
    num: 8,
    key: 8
  },
  {
    dow: "Fri",
    num: 9,
    key: 9
  },
  {
    dow: "Sat",
    num: 10,
    key: 10
  },
  {
    dow: "Sun",
    num: 11,
    key: 11
  },
  {
    dow: "Mon",
    num: 12,
    key: 12
  },
  {
    dow: "Tue",
    num: 13,
    key: 13
  },
  {
    dow: "Wed",
    num: 14,
    key: 14
  },
  {
    dow: "Thu",
    num: 15,
    key: 15
  },
  {
    dow: "Fri",
    num: 16,
    key: 16
  }
];

export const CALENDAR: CalEvent[] = [
  {
    id: "c1",
    day: 6,
    time: "1:30 PM",
    kind: "Committee",
    body: "Housing & Land Use Committee",
    what: "ADU rule implementation; affordable housing fund criteria.",
    where: "Council Chambers · live on 53",
    match: "Housing"
  },
  {
    id: "c2",
    day: 7,
    time: "5:30 PM",
    kind: "Community",
    body: "Lahaina Community Meeting",
    what: "Office of Recovery in person — Housing Navigator, FEMA rent change, rebuild Q&A.",
    where: "Lahaina Civic Center",
    match: "Storm recovery",
    href: "https://countymeetings.eventcalendarapp.com/countys-in-person-lahaina-community-meeting-14"
  },
  {
    id: "c3",
    day: 8,
    time: "9:00 AM",
    kind: "Commission",
    body: "Cultural Resources Commission",
    what: "Iwi kūpuna protocols for Lahaina rebuild sites.",
    where: "Kalana Pakui · live on 53",
    match: "Culture & ʻāina"
  },
  {
    id: "c4",
    day: 9,
    time: "9:00 AM",
    kind: "Council",
    body: "Maui County Council",
    what: "23 items — Lahaina water funding plan (item 9), rental amendment status (item 14), grant rules input (item 17).",
    where: "Council Chambers, Wailuku · live on 53",
    match: "Lahaina water · Short-term rentals"
  },
  {
    id: "c5",
    day: 13,
    time: "9:00 AM",
    kind: "Commission",
    body: "Maui Planning Commission",
    what: "SMA boundary assessment — staff report after community meetings.",
    where: "Planning Conference Room · live on 53",
    match: "Events"
  },
  {
    id: "c6",
    day: 14,
    time: "6:00 PM",
    kind: "Community",
    body: "SMA boundary public meeting — South Maui",
    what: "Planning Department; where the coastal line sits.",
    where: "Kīhei Community Center",
    match: ""
  },
  {
    id: "c7",
    day: 16,
    time: "9:00 AM",
    kind: "Council",
    body: "Maui County Council",
    what: "Second reading, Bill 72; short-term rental phase-out amendment returns.",
    where: "Council Chambers, Wailuku · live on 53",
    match: "Short-term rentals"
  }
];

export const FOLLOWUPS: FollowUp[] = [
  {
    id: "f1",
    status: "Overdue",
    promise: "We will have the Wahikuli pressure-zone bids out by the end of September.",
    who: "Director, Dept. of Water Supply",
    said: "BWS · Jul 24",
    due: "Due Sep 30",
    update: "No bid posting found on the County procurement site as of Oct 5. Results now promised for the Oct 23 Board meeting.",
    proof: "▶ BWS · Sep 25 · 0:09:40",
    mid: "m3",
    seek: "0:09:40"
  },
  {
    id: "f2",
    status: "Done",
    promise: "We'll get a written Lahaina restoration timeline to the Council before the October meeting.",
    who: "Director, Dept. of Water Supply",
    said: "Council · Sep 4",
    due: "Done Sep 25",
    update: "Delivered — presented to the Board Sep 25 and confirmed received at Council Oct 2.",
    proof: "▶ Council · Oct 2 · 4:21:05",
    mid: "m1",
    seek: "4:21:05"
  },
  {
    id: "f3",
    status: "In progress",
    promise: "A Housing Navigator for every wildfire-impacted household that wants one.",
    who: "Mayor's Office",
    said: "Lahaina Community Meeting · Aug 12",
    due: "Launched Oct 1",
    update: "Program announced Oct 1. First enrollment numbers expected at the Oct 7 community meeting.",
    proof: "mauirecovers.org · Oct 1",
    href: "https://www.mauirecovers.org/news/county-of-maui-announces-housing-navigator-program-for-wildfire-impacted-households"
  },
  {
    id: "f4",
    status: "Scheduled",
    promise: "The rental amendment comes back with a fiscal impact analysis.",
    who: "Council Chair",
    said: "Council · Oct 2",
    due: "Due Oct 16",
    update: "On the Oct 16 agenda. Analysis not yet posted with the agenda packet.",
    proof: "▶ Council · Oct 2 · 4:48:05",
    mid: "m1",
    seek: "4:48:05"
  },
  {
    id: "f5",
    status: "Done",
    promise: "Adopt accessory dwelling rules to open up housing this summer.",
    who: "Mayor's Office",
    said: "Budget message · Mar 2026",
    due: "Done Jul 16",
    update: "Rules adopted July 16, 2026.",
    proof: "mauirecovers.org · Jul 16",
    href: "https://www.mauirecovers.org/news/county-of-maui-adopts-new-accessory-dwelling-rules-to-expand-housing-opportunities"
  },
  {
    id: "f6",
    status: "In progress",
    promise: "Construction traffic for the Kīhei high school road will avoid Piʻilani during school hours.",
    who: "Planning Commission (permit condition)",
    said: "Planning Commission · Sep 30",
    due: "Ongoing",
    update: "Condition attached to the SMA permit. Monitoring begins when Public Works issues the grading permit.",
    proof: "▶ Planning Commission · Sep 30 · 2:38:44",
    mid: "m2",
    seek: "2:38:44"
  },
  {
    id: "f7",
    status: "Overdue",
    promise: "The permit-timeline dashboard goes public this fiscal year.",
    who: "Dept. of Public Works",
    said: "Budget hearing · Apr 2025",
    due: "Due Jun 30",
    update: "Not published. DPW cited the vendor contract in September; no new date given.",
    proof: "▶ Budget hearing · Apr 2025",
    mid: "m1",
    seek: "0:03:12"
  }
];

export const FU_COLORS: Record<FollowUpStatus, string> = {
  Done: "#2fbf71",
  "In progress": "#4da3f0",
  Scheduled: "#9aa5b4",
  Overdue: "#f0b034"
};
