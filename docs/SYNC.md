# Akakū app ↔ Pipeline: shared status

Two projects, two Claude sessions, one product. This file is the **app side's** report.
Pipeline keeps a matching file at `docs/SYNC.md` in its own repo.

**How we use it**
- At the **start** of a session, read the other project's SYNC.md.
- At the **end** of a session, update your own, then tell the user what changed.
- Only write your own side. If the other side needs to change something, put it under
  **Requests** and let the user carry it over.
- Report only what you have verified. Mark anything secondhand "per the other session".

Other side: <https://github.com/shootsproductions-prog/pipeline> (private; the user can paste its SYNC.md).

---

## Last updated

2026-10-07, app side. App default branch `claude/festive-cannon-Z5mAN` at `9a61f14`.
Pipeline `main` at `a386348` (build 1.1.4), checked on GitHub.

## What is live in the app

- **Live channels 53, 54, 55** from the Castus HLS links, with posters and the official names
  (Government & Public Affairs, All Access All The Time, Live & Local). Edit `apps/mobile/src/data/liveFeeds.ts`.
- **County Watch recaps**, loaded from `content/meetings/index.json` on the default branch, cached for offline use,
  falling back to demo content. Meetings sort newest first by `meetingDateISO`.
- **Four issue pages** (Water, Housing, Food Security, Disaster Recovery), built from every published meeting.
  People follow from this fixed list; nothing can be typed in.
- **Recap screen:** disclaimer under every recap and at the bottom; every `[[h:mm:ss]]` / `[[#n]]` marker opens the
  YouTube video at that moment; a vote side with no stated count shows "Not stated".
- **One recap published:** the Sept 28 Civil Service Commission meeting (`H9lx2zorcDM`, 16 proof markers, `issues: []`).
- **Publish script:** `content/publish-meeting.mjs` copies only the app-facing fields, refuses drafts without
  `--reviewed`, refuses a missing disclaimer, and refuses any issue label outside the four.

## The contract (what Pipeline writes and the app reads)

A published recap file, one per meeting, in `content/meetings/<videoId>.json`:

| Field | Rule |
|---|---|
| `videoId` | YouTube ID. Proof links are `https://youtu.be/<id>?t=<seconds>`. |
| `status`, `disclaimer`, `generatedAt` | `disclaimer` is required and shown on every recap. |
| `meetingDateISO` | `YYYY-MM-DD`. The app sorts on it. |
| `headline`, `topics` | `topics` are the issue labels present. |
| `meeting` | The app's `Meeting` type (`apps/mobile/src/data/types.ts`). `ayes`/`noes` may each be `null`. `votes` is always `[]`. `recap` has one fact per sentence, each followed by `[[h:mm:ss]]`, in time order. |
| `issues` | The app's `Issue` type plus `issue`: `Water`, `Housing`, `Food Security` or `Disaster Recovery`. Never `other`. Can be `[]`. Each brief sentence has its own `[[#n]]` and its own entry in `sources`. |
| `source` | Only `youtubeUrl` is kept. |

If this shape changes, update `types.ts`, `apps/mobile/src/data/remote.ts`, the fixtures in
`apps/mobile/test/fixtures/`, and `content/publish-meeting.mjs` together. The real Sept 28 file is the fixture.

## Decisions so far

- 2026-10-05: scope is our own YouTube videos only; no scraping of County sites.
- 2026-10-05: recaps may auto-approve, with a disclosure and a weekly accuracy check.
- 2026-10-05: the four issues are Water, Housing, Food Security, Disaster Recovery.
- 2026-10-06: a meeting with no matching issue still publishes. Issue labels only decide the issue pages.
- 2026-10-06: start with the County Watch playlist; widen to the whole channel later.
- 2026-10-06: no AWS for now. Content is served from GitHub; streams stay on the Castus links.
- Votes come only from what was said on the recording. The app never shows per-seat votes.

## Not verified yet (app side)

- The app on a real phone (Expo Go). Proof markers opening real YouTube videos.
- Chromecast / AirPlay (needs a development build).
- A real recap arriving through YouTube. Only the Sept 28 file has been through the app.

## Requests to Pipeline

1. Run `node county-watch.js scan`, then a recap on one real video, and report the result. The first YouTube run is untested.
2. Before turning on auto-publish, run `audit --sample 10` on the first few published claims.
3. Tell us if the recap shape changes, before it ships.

## What the app side needs to know from Pipeline

(Pipeline fills this in on its side: what changed, what is untested, anything the app should expect.)
