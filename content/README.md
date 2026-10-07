# County Watch content

Recaps shown in the app's Meetings tab. The app loads
`content/meetings/index.json` and the files it lists from the default branch
(see `CONTENT_BASE_URL` in `apps/mobile/src/data/remote.ts`). While the index is
empty, or if it can't be reached, the app shows its demo content.

## Publishing a meeting

Two kinds of file come out of Pipeline's County Watch:
- **Auto-publish file** (`<videoId>.publish.json`): already trimmed for the app.
- **Full review draft** (`<videoId>.json`): includes internal review data. It needs `--reviewed`.

1. Run `node county-watch.js VIDEO_ID` in Pipeline, read `county-watch/VIDEO_ID.json`, and fix
   anything under `review_flags`. Every claim must check out against the recording.
2. From this repo: `node content/publish-meeting.mjs path/to/FILE.json [--reviewed]`.
3. Commit `content/` and merge to the default branch. The app picks it up on next launch
   (GitHub caches raw files for a few minutes).

The script copies only the app-facing fields (videoId, status, disclaimer, generatedAt,
meetingDateISO, headline, topics, meeting, issues, and source.youtubeUrl). Review flags,
verification, claims, run costs and the rest are dropped. A draft published with `--reviewed`
is marked "reviewed". It refuses a file with no disclaimer, or with an issue labeled anything
other than Water, Housing, Food Security or Disaster Recovery.

Unpublish with `node content/publish-meeting.mjs --remove VIDEO_ID`.

Run the tests with `cd apps/mobile && npm test`.

Every recap shows "Summarized by Akakū Intelligence. It can make mistakes."

## Issues catalog (`content/issues/`)

The curated list of community issues, produced by Pipeline and approved by the producer. The
format is the `issues-catalog` contract on the project board. The app reads `index.json` and the
files it lists (see `CATALOG_BASE_URL` in `apps/mobile/src/data/catalog.ts`). While the index is
empty, the app keeps showing the four fixed topics.

- Publish: `node content/publish-issue.mjs path/to/<slug>.json`. It keeps only the app-facing
  fields and refuses a `proposed` issue, a missing disclaimer, a source without proof (a meeting
  needs a video id and timestamp; any other source needs an https url, publisher and quote), and
  a `conflicting` entry without its other side.
- Merge two issues: `node content/publish-issue.mjs --alias old-slug=new-slug`. Followers of the
  old slug end up following the new one. Slugs never change once published.
- Default follows (the flagship, water): `node content/publish-issue.mjs --default-follow <slug>`.
- Unpublish: `node content/publish-issue.mjs --remove <slug>`.

Rankings use the raw counts in `signals` (pinned first, then meetings in the last 30 days, then
most recently seen); the app shows the reason in words and computes "Heating up" itself. Test
fixtures are made up and must never be copied into `content/issues/`.
