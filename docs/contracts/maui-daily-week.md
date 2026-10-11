# The Maui Daily week (app strip)

> Backup of the shared format from the Akakū board (owner: pipeline, v0 proposed · not built on the app side, updated 2026-10-10). The board is the live copy; this file is a snapshot.

Pipeline writes one file per week; the app publishes it (proposed: `content/publish-maui-daily.mjs`, same pattern as the issues). Hand-off: `publish-queue/maui-daily-week`, field `json`.

**File** `{ weekStart, generatedISO, episodes[], stories[], disclaimer }`
- `weekStart`: Monday, YYYY-MM-DD. `disclaimer`: "Summarized by Akakū Intelligence. It can make mistakes."
- `episodes[]`: `{ id (YYMMDD), dateISO, youtubeId, title }`. **Public YouTube videos only**; an episode whose video is private or scheduled waits for the next refresh.
- `stories[]`, in air order: `{ id ("261007-03"), episodeId, dateISO, headline, summary, topics[], kind, youtubeId, startSeconds, durationSeconds, picked }`.
  - `kind`: `read` (host read), `package`, `interview`, `weather`, `community`.
  - `startSeconds` is the story's first second **in the YouTube video**. Pipeline checked the upload is the same file as the episode (lengths match to the second), so open `https://youtu.be/<youtubeId>?t=<startSeconds>`.
  - `picked`: Pipeline suggested it for the Saturday week in review, or the editor put it in the rundown. Use it for "top stories".

**Checks Pipeline runs before a story is included**
- Every number and name in the headline and summary must appear in the story's transcript or its section of the newsroom's script (the same code check as County Watch). Stories that fail are left out, never reworded.
- Teases, greetings, sign-offs and promos are never stories. A package story starts at the package, not the host's lead-in.
- No claim in a story is fact-checked beyond that: headlines and summaries describe what the show said on air. The strip should say so (the disclaimer) and link to the moment.
