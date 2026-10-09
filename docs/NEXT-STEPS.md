# Next steps (written Oct 11, 2026, for the producer's office computer)

State of play: the app works on the producer's iPhone through Expo Go. Everything is merged on `claude/festive-cannon-Z5mAN`. Launch target: before the Nov 3 election (`docs/LAUNCH.md` has the timeline).

## 1. On the office computer: get the latest code (2 minutes)
In Terminal, in the `akaku-tv` folder (not the Pipeline folder):
```
git checkout claude/festive-cannon-Z5mAN
git pull
cd apps/mobile
npm install
```

## 2. Two akaku.org pages (10 minutes, in WordPress)
Create `/app-privacy/` and `/app-support/` from `docs/site/dist/privacy.body.html` and `support.body.html` (Pages, Add New, Custom HTML block, paste, set the permalink, Publish). The app already links to those addresses. Tell the app session when they are live.

## 3. The "Report an error" form (5 minutes)
1. Google Forms: new form with four short-answer questions named About, Comment, Where, App.
2. Three-dot menu, Get pre-filled link, type x in each field, Get link. Send that link to the app session.
3. Responses tab, turn on email notifications to the mailbox Pipeline reads.
The app session then sets `FEEDBACK` in `apps/mobile/src/lib/feedback.ts`; the button turns on in real builds.

## 4. First test build (needs the Expo login)
```
cd apps/mobile
npx eas-cli login          # username: shootsproductions
npx eas-cli init           # creates the project and writes extra.eas.projectId into app.json
npx eas-cli build --profile preview --platform android
```
- The Android build produces an installable file. Use it to prove the build pipeline works and for staff with Android phones.
- **iPhone builds need Apple's approval first** (the Developer Program enrollment is being processed). Until then, keep testing on the iPhone with Expo Go. When Apple approves: `npx eas-cli build --profile production --platform ios`, then `npx eas-cli submit --platform ios`, which puts the build in TestFlight.
- Commit the `app.json` change that `eas init` makes and tell the app session.

## 5. Pipeline session: things waiting on it
Open the Pipeline session and paste:
```
Read the project board. Open asks for you: ask-app-videos-channel-feed (publish the full channel video feed, no Shorts), ask-app-error-report-triage (design how reader error reports are checked and fixed), and ask-app-water-issues-feedback (de-duplicate East Maui, spell out BLNR/CWRM/TIG, add the West Maui July 16 meeting, republish). Hand finished files to publish-queue as before, post a short report on the board, and do not run git in akaku-tv.
```

## 6. Things only the producer can decide or supply
- Counsel review of the privacy policy (`docs/site/privacy.md`) before it is public.
- Google Play: change the public developer name from a person's name to Akakū and use shared organization contact details.
- Move the Expo project to an organization named `akaku`? (Personal account `shootsproductions` is set for now.)
- Radio schedule address (the show list for "Coming up on KAKU").
- YouTube channel link (or ask Pipeline), so Videos shows all uploads.
- Approve the data sources (Council RSS, Legistar, State Water Commission) and choose how to get County releases (email subscription or permission).
- Fix the 8 public YouTube descriptions that say the wrong year.
- Apple and Google enrollment approvals: watch email and phone for verification contact.

## 7. Store paperwork already drafted
`docs/STORE_LISTING.md` (names, descriptions, keywords, review notes, screenshot plan) and the privacy form answers in `docs/LAUNCH.md`.
