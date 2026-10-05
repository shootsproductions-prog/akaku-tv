# Akakū mobile app (iOS + Android)

Expo / React Native app built from the Claude Design handoff: Akakū Maui Community Media on your phone. You can watch Channels 55 · 54 · 53 live, follow the County through Akakū Intelligence, browse community video, listen to KAKU 88.5, and become a sustaining member.

```bash
cd apps/mobile
npm install
npm start          # then press i (iOS simulator) / a (Android) or scan with Expo Go
npm run typecheck
```

Expo SDK 57, expo-router, TypeScript strict.

## What's in it

Tabs: **Live · Meetings · Videos · Radio · Support**. Videos is the centre tab.

| Screen | Notes |
|---|---|
| Live (`app/(tabs)/index.tsx`) | Three channel tiles with a "Live frame · Ns ago" stamp and now/next. Also a County Watch teaser and The Maui Daily. The header has the theme toggle (sun/moon) and **Aa**, which turns on Kūpuna mode (all type 18% larger). |
| Player (`app/player/[num].tsx`) | Live player, channel switcher, tonight's guide. On Channel 53 it shows a "Live transcript running" card that links to County Watch. |
| Meetings (`app/(tabs)/meetings.tsx`) | County Watch. It has transcript search with an "Explain '…'" option, a new-term countdown and the weekly brief. Below those are big-question explainers, topics, followed issues, the hearings calendar with reminders, the Follow-ups ledger and recent meetings. |
| Meeting (`app/meeting/[id].tsx`) | 90-second recap. Each numbered proof mark cues the recording to its timestamp. Also shows decisions, the vote record by seat and jump-to-moment. |
| Issue (`app/issue/[name].tsx`) | In one line / why it matters / deadlines, then a footnoted brief, a timeline, sources and the weekly report sheet. |
| Explainer (`app/explainer/[id].tsx`) | Short answer, reasons ranked by share of discussion, history, who decides / what would change it, and sources. |
| Videos (`app/(tabs)/videos.tsx`) | Social-style feed with filters, like, share and cast. **Submit** goes through a sign-up gate before the submission sheet opens. |
| Radio (`app/(tabs)/radio.tsx`) | KAKU 88.5 player and today's schedule. While it plays, a mini-player sits above the tab bar on every other tab. |
| Support (`app/(tabs)/support.tsx`) | "Our story" video from akaku.org/about (plays inline), why community media matters on Maui, pay-what-you-want membership and the PEG funding alert. |

Across the app:

- **Light/dark** follows the device. The header toggle overrides it, and the choice is saved along with Kūpuna mode.
- **AirPlay on iOS, Cast on Android.** The glyph, labels and device list follow the platform.
- **Read aloud** on recaps, issue briefs and explainers (expo-speech).
- **Akakū Intelligence** badge on everything the AI produces.

## Layout

```
app/                 routes (expo-router)
src/data/            demo content + types.ts (the shapes real sources must fill)
src/components/      Txt (themed + Kūpuna scaling), Icon, ui primitives, TabBar, Sheets, media
src/state/AppState   theme, Kūpuna, radio, cast, sheets, account, follows, reminders, likes
src/lib/             segments ([[h:mm:ss]] / [[#n]] proof marks), navigation, read-aloud
src/theme.ts         Akakū tokens: blue #0c80e2, ink #0a6bbd, light/dark palettes
```

## Demo data vs. real data

Everything renders from `src/data/*`. The County releases and Maui Recovers links are real. Meeting quotes, votes, explainers and follow-ups are illustrative. Each item below is a ready-made seam:

| Seam | Where | To wire |
|---|---|---|
| Live HLS | `Channel.hlsUrl` in `channels.ts` | Paste the Castus `.m3u8` URLs (the same TODO as `roku-channel/live-channels/*.json`). The player switches to `expo-video` automatically. |
| Live frames | `Channel.thumbnailUrl` | A frame-grab URL refreshed on each open, like akaku.org. |
| Video feed | `FeedItem.youtubeId` | Pull from the YouTube Data API. Thumbnails and inline play turn on per item. |
| KAKU stream | `AppState.radioOn` | Add the stream URL and an audio player with background playback (`UIBackgroundModes: audio` is already set). |
| AirPlay / Cast | `Sheets.tsx › CastSheet` | iOS: `AVRoutePickerView` (expo-video already allows external playback). Android: `react-native-google-cast`. Both need a dev build, not Expo Go. |
| Sign-in | `AppState.signIn` | Apple / Google / email. The design says the same login works at akaku.org. |
| Video upload | `SubmitSheet` | File picker, then a direct-to-Mux upload (same flow as `apps/admin`), then a record. |
| Akakū Intelligence | `countyWatch.ts`, `meetings.ts` | Transcripts, briefs, explainers, follow-ups, transcript search and "Ask a follow-up". |
| Reminders / alerts | `AppState.reminders`, `issues` | Push notifications. |
| Payments | Support › Give button | Stripe or store billing. |
| Weekly report | Report sheet › Save PDF, Issue › Email me weekly | Report generator + mailer. |

Not wired yet (visual only): voice search, the comment counts, Ask a follow-up, Give, Email me weekly and Save PDF.

`app.json` uses `org.akaku.app` as the bundle ID / package. Change it before the first store build if Akakū already owns a different identifier.
