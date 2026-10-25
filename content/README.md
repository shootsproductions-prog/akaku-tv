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

## Automatic publishing from Pipeline (`content/incoming/`)

When the producer approves an issue in Pipeline, Pipeline puts the file at `content/incoming/<slug>.json`
(through the GitHub API, using a token limited to this repo). `.github/workflows/publish-incoming.yml` then runs
`node content/process-incoming.mjs`, which applies the same checks as `publish-issue.mjs` (including the election
hold), writes the app-facing copy to `content/issues/`, lists it in `index.json`, runs the content tests, and commits
to the default branch. The app and akaku.org/track read `content/issues/`, so both update on their own, usually
within about 15 minutes of the approval.

A file that fails a check is moved to `content/rejected/<slug>.json` with `<slug>.reason.txt` saying why; nothing
about it goes live and the workflow run turns red. Fix the cause in Pipeline and approve again. Aliases, default
follows and unpublishing still use `publish-issue.mjs` by hand (rare).

The feed's bookkeeping is rewritten on every publish (`content/feed.mjs`): `content/issues/index.json` also carries
`updatedAt`, an `etag`, and `files` (each file's `updatedAt` and `sha256`, which move only when its content changes);
`content/issues/catalog.json` holds every listed issue in one file; `content/issues/meta.json` is a small "anything new?"
check. Readers can skip files whose `updatedAt` has not moved.

### Withdrawing and meetings through `content/incoming/`

- `content/incoming/<slug>.withdraw` (an empty file) takes a published issue down: its file, index entry, default follow,
  and any merge that pointed at it.
- `content/incoming/index-changes.json` changes the index: `{ "merge": {"old-slug": "new-slug"}, "unmerge": ["old-slug"],
  "defaultFollows": ["slug"] }`. A merge needs the old slug withdrawn (it may be in the same push) and a published
  target, with no chains; `defaultFollows` replaces the list (at most 5, all published). Anything else is rejected whole.
- `content/incoming/meetings/<videoId>.json` publishes an approved recap to `content/meetings/` with the same checks as
  `publish-meeting.mjs`. It must carry a real 11-character YouTube id (never an internal recording id) and passes the
  election hold. `content/incoming/meetings/<videoId>.withdraw` takes it down.
- Failures land in `content/rejected/` (meetings: `content/rejected/meetings/`) with `<name>.reason.txt`.

### Politics hold, optional fields and the meetings catalog (Oct 25)

- The hold covers **campaigning only** (`content/campaign.mjs`, the same rule Pipeline uses): forums, debates, endorsements,
  re-election, "vote for me", campaign finance and events. Charter amendments, ballot measures, election administration and
  board nominations are public. `--allow-election` still lifts the hold for one run.
- Timeline entries may have `basis: "reported"` (a development from a County release or page; the source needs url, publisher
  and quote). The app labels it "Reported by <publisher>".
- A meeting source may carry `endTs` (where the cited moment stops, at most 2 minutes after `ts`); an unusable one is dropped.
- An issue may carry `boards` ([{ name, group: council|board|county, short[] }]) and `bills` (strings) for search.
- `content/meetings/catalog.json` lists every published meeting in one small file (newest first, with `updatedAt` and `etag`);
  it is rebuilt whenever a meeting is published or withdrawn.
