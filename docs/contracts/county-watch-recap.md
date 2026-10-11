# County Watch recap file

> Backup of the shared format from the Akakū board (owner: pipeline, v2 · pipeline#1 + akaku-tv#4, updated 2026-10-06). The board is the live copy; this file is a snapshot.

Pipeline writes `county-watch/<videoId>.json`; the app publishes it with `content/publish-meeting.mjs`, which keeps only the fields marked **app**.

**Top level**
- `videoId` (app), `status` (app): draft files say “draft — needs review, not published”, auto-publish files “auto-published: only claims that passed both checks”; a `--reviewed` publish sets “reviewed”.
- `disclaimer` (app): always “Summarized by Akakū Intelligence. It can make mistakes.”
- `generatedAt`, `meetingDateISO` (app, YYYY-MM-DD, use for sorting), `headline` (app), `topics` (app: issue labels present).
- `source` (app keeps only `youtubeUrl`).
- Internal, never published: `review_flags`, `verification`, `claims`, `run`, `summarySource`.

**meeting** (app’s Meeting type)
- `id` = YouTube video id. `mon`, `day`, `date` (“Mon, Sep 28, 2026”), `body`, `dur` (“27 m”, “2 h 05 m”).
- `voteCount`, `voteItem`, `ayes`, `noes`: each count is a number only when said, otherwise `null`. `votes` is always `[]`.
- `summary`: one sentence, at most 25 words, checked against the passing claims; falls back to the headline.
- `recap`: one fact per sentence, each followed by `[[h:mm:ss]]`, in time order.
- `decided` (list), `next` (text), `moments` ({t, q}, sorted by time).

**issues** (app’s Issue type plus `issue`)
- `issue`: Water | Housing | Food Security | Disaster Recovery. Never “other”. Can be `[]`.
- `since`, `oneLine`, `why`, `next`, `deadlines` ({d, t}, d as said in the meeting).
- `brief`: sentences each ending in `[[#n]]`, each with its own `sources` entry {n, title, where, view {type: meeting, id}, seek h:mm:ss}.
- `timeline`: one entry, kind “tv”.
