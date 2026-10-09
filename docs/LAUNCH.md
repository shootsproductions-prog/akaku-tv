# Akakū app: launch plan

Goal: public beta in the stores before the general election (Tuesday, Nov 3, 2026; confirm the date).
Written Oct 9, 2026 (25 days out). Rules change; check Apple's and Google's pages before relying on a detail here.

## Work only the producer can do (accounts, identity, money)
1. **Apple Developer Program, as an organization.** Needs Akakū's legal name, a D-U-N-S number (free to request; can take days to two weeks, so start first) and someone with authority to sign. Nonprofits can ask Apple for a fee waiver. Organization enrollment also puts "Akakū" as the seller name, not a person.
2. **Google Play Console, as an organization.** Also needs the D-U-N-S number. A personal account must run a 14-day closed test with at least 12 testers before it can go public; organization accounts are exempt.
3. **Expo account** (free to start) in Akakū's name. Send the project owner name; the app session adds it to `apps/mobile/app.json` (`extra.eas.projectId`, `owner`).
4. **A privacy policy and a support page** at a real web address (akaku.ai or akaku.org). Both stores require them. The app collects: what you follow (stored on the phone), no accounts, no analytics yet. The policy must say so, and must be updated if that changes.
5. **Donation address** for the Support tab (the page Akakū already uses to take donations).

## App work (app session)
- App icon, splash and store screenshots (iPhone sizes; Android phone).
- Store listing text (name, subtitle, description, keywords, category, age rating, "contains AI-generated content" wording and the disclaimer).
- Production build profile (`eas.json`), version and build numbers, TestFlight build.
- Remove or hide anything development-only (sample issues are already `__DEV__` only).
- "Report an error" link on issue and recap pages (opens an email or form) so readers can flag a mistake. Required in spirit: the disclaimer says AI can make mistakes, and readers need a way to tell us.
- Crash and error reporting (free tier) so we hear about problems before reviews do.

## Timeline (backwards from Nov 3)
| When | What |
|---|---|
| Oct 9-12 | Start Apple and Google organization enrollment (D-U-N-S first). Expo account. Decide donation address. |
| Oct 12-16 | Privacy policy and support page live. First EAS build. App icon and screenshots. |
| Oct 16-19 | TestFlight internal testing (staff, up to 100 people). Fix list. |
| Oct 19-23 | External beta, 20-50 community testers (Beta App Review, usually about a day). Android closed test. |
| by Oct 23 | **Submit to App Store review** and Google Play production. Leaves about a week for a rejection and resubmission. |
| Oct 30 | Freeze: no new features, only fixes. |
| Nov 3 | Election day: app live, Akakū promotes it on air and online. |

Biggest risk: account enrollment. D-U-N-S and organization verification are the only steps that can take more than a few days, and nothing else can start without them.

## Money (decision record, Oct 9)
- Launch free. Everything in the app stays free to read, in keeping with Akakū's public-service promise.
- Support tab: one-time gift and monthly sustaining membership, handled on Akakū's existing donation page (opened in the in-app browser). No payment processing is built into the app.
- Per-user cost is near zero (issues are prepared ahead of time and published as files), so free scales.
- Revisit after the election with real numbers: opens, follows per person, return visits, gifts started from the app, and a short survey. Possible later member perks that cost real money to run (alerts, a weekly email digest) can be tested then; paywalling facts about county government is not planned.

## Store privacy forms (draft answers, Oct 10; have Akakū's counsel review)
Both stores ask what the app collects. This is what the app does today (the policy in `docs/site/privacy.md` says the same). A test fails if analytics, notifications, location, camera or contacts libraries are added without updating this.

**Apple "App Privacy" (nutrition label)**
- Tracking: **no**. The app does not track people across apps or sites.
- Data collected: the only data Akakū receives is an optional "Report an error" (what was reported, an optional comment, device type and app version). Declare it as *Other User Content*, **not linked to identity, not used for tracking**, purpose *App Functionality / Customer Support*. If the stores treat the optional comment as "Customer Support" data, choose that. Everything else (follows, display settings) stays on the phone.
- Third-party content (YouTube player, streams) may collect data under their own policies; the policy page says so. Check Apple's current wording on embedded players before submitting.
- Age rating: no objectionable content; general audience. Not directed to children.
- Also required: a **Support URL** (`SUPPORT_URL`) and a **Privacy Policy URL** (`PRIVACY_URL`) once the pages in `docs/site/` are hosted.

**Google Play "Data safety"**
- Data collected: **User content** (optional error reports) only; optional, not shared with third parties for their own use, encrypted in transit, can be deleted on request by emailing the contact address.
- Data shared: none beyond the services needed to play video and audio (YouTube, streaming providers), which collect data under their own policies.
- The app has no account, so the account-deletion question is "not applicable".
- Same privacy policy URL.
- Content rating questionnaire: news and civic information; no user-to-user communication.

**Both stores**
- The Support-tab "Give" button opens akaku.org in a browser (a nonprofit donation link). Apple has specific rules for nonprofit fundraising; confirm the current text and, if asked, state that Akakū is a registered nonprofit and gifts are processed on its website.
- Disclose that summaries are AI-generated and may contain errors (store description, and the in-app disclaimer already says it).

## Accounts: where things stand (Oct 10)
- Apple Developer Program: nonprofit enrollment submitted, waiting for Apple to verify the organization and the signer's authority (they may phone or email).
- Google Play: organization account created. Before publishing, change the public developer name from a person's name to Akakū and use shared organization contact details (the profile shows an email and phone number publicly).
- Expo: username `shootsproductions` is set as the project owner in `apps/mobile/app.json`. It is a personal account; consider moving the project to an organization named `akaku` before launch so it does not depend on one person (an organization `shoots-productions` also exists on that account).
- Next steps for a first build: `cd apps/mobile && npx eas-cli login && npx eas-cli init` (creates the project id), then `eas build --profile preview --platform ios`.
