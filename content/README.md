# County Watch content

Recaps shown in the app's Meetings tab. The app loads
`content/meetings/index.json` and the files it lists from the default branch
(see `CONTENT_BASE_URL` in `apps/mobile/src/data/remote.ts`). While the index is
empty, or if it can't be reached, the app shows its demo content.

## Publishing a meeting

1. In Pipeline, run `node county-watch.js VIDEO_ID` and review `county-watch/VIDEO_ID.json`.
   Fix anything under `review_flags`; every claim must check out against the recording.
2. From this repo: `node content/publish-meeting.mjs path/to/VIDEO_ID.json --reviewed`
   (`--reviewed` confirms a person checked it; drafts are refused without it).
3. Commit `content/` and merge to the default branch. The app picks it up on next launch
   (GitHub caches raw files for a few minutes).

Unpublish with `node content/publish-meeting.mjs --remove VIDEO_ID`.

Every recap shows "Summarized by Akakū Intelligence. It can make mistakes."
