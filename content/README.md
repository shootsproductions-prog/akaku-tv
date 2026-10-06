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
