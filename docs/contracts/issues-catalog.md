# Issues catalog

> Backup of the shared format from the Akakū board (owner: pipeline, v0.2 · adds optional `speaker`, `asOfISO`, and meeting-sourced `upcomingEvent` (akaku-tv#15), updated 2026-10-08). The board is the live copy; this file is a snapshot.

Status: **v0.1.** Pipeline writes `issues/<slug>.json`; the app publishes it with `content/publish-issue.mjs` (same pattern as `publish-meeting.mjs`: validates, keeps only app fields, refuses anything else). Published files live in `content/issues/`. The app side (parser, publish script, follow flow, issue pages) is merged.

**Index** `content/issues/index.json`
- `issues`: list of file names, one per approved issue.
- `aliases`: `{ "<old-slug>": "<new-slug>" }`. When the producer merges A into B, A's followers end up following B. Slugs never change once published.
- `defaultFollows`: list of slugs new users start out following (the water flagship). Changed from Pipeline, not with an app release.

**Issue file**
- `slug` (immutable), `title` (plain and specific), `summary` (2-3 sentences), `topics` (broad tags, open list, producer-approved).
- `status`: `active` | `quiet` | `resolved`. Set by the producer. `proposed` never leaves Pipeline. "Heating up" is not a status; the app computes it from `signals`.
- `pinned` (producer only), `firstSeenISO`, `lastSeenISO`.
- `signals`: raw counts only, no score. `meetingsLast30d`, `meetingsLast90d`, `mentionsLast30d` (a mention is one verified claim, capped at 3 per meeting; meetings counted per de-duplicated meeting group), `upcomingEvent` = `{ dateISO, what, source } | null` (only when a dated source says so; `null` in v1).
- `timeline[]`, newest first in the app: `{ dateISO, text, basis, source, body?, speaker? }`. **`body`** (v0.1) is the board the fact came from (for example "Board of Water Supply"), shown beside the date. **`speaker`** (v0.2, optional) names who said it, shown under the text; fill it only when the captions make the speaker certain.
- **`asOfISO`** (v0.2, optional date): when Pipeline last checked the sources. The app shows "Sources last checked ..." and warns after 14 days, since `signals` are a snapshot. Republish each issue at least weekly. Without it the app uses the newest source check, then `lastSeenISO`.
- **`upcomingEvent`** (v0.2): may be filled from a **meeting statement** (a meeting source with a timestamp) when the date is in the future and the statement is the latest on that event. The app shows the proof and says dates can change.
- `disclaimer`, and the source types used (the publish script computes `sourceTypes`).

**Proof shape (one for every timeline entry)**
- `source: { type: "meeting", videoId, ts, retrievedISO }` or `{ type: "county-release" | "county-page" | "other", url, publisher, quote, retrievedISO }`.
- `quote` is the short passage the fact rests on. Every number and name in `text` must appear in the quote or the cited captions (same code check as recaps).
- Suggested types for approved sources: Council RSS and State Water Commission pages = `county-page`; Legistar agendas = `county-page` (for `upcomingEvent`) or `other` with `publisher` set.

**Labels (`basis`)**
- `said-at-meeting`: one meeting source, attributed to a speaker.
- `confirmed`: two independent records agree on a fact (for example a vote in the video and in the minutes). Independent means different records, not the same release on two sites.
- `conflicting`: sources disagree. Entries sharing a `conflictGroup` id are shown together, both sides. A conflict needs at least two entries.

**App behaviour (the app computes these, nothing hidden)**
- Order: resolved last; then pinned first, then `meetingsLast30d`, then `lastSeenISO`.
- Badge "Heating up" when `meetingsLast30d` is at least 2 and at least twice its share of `meetingsLast90d` (that is, `meetingsLast30d >= 2 * meetingsLast90d / 3`). The app shows the reason, for example "Discussed in 4 meetings this month".
- The recap's four labels (`issue`) keep working until both sides ship; they become `topics`.

**Not in v1:** auto-proposed issues (v2), County sources (v3, after the producer approves the source list), `upcomingEvent` values.
