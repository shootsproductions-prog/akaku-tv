# Akakū Community Archive — Roku channel (Stage 1: Direct Publisher)

Stage 1 of the Akakū Community Media Roku channel. This folder generates a
[Roku Direct Publisher][dp-overview] JSON feed from per-record catalog files,
so the channel can be published without writing any BrightScript. Stage 2
(native SceneGraph + Mux Data SDK) is deferred — see "Stage 2" at the bottom.

```
roku-channel/
├── records/<record_id>/metadata.json   ← input: one file per program/segment
├── scripts/build-feed.mjs              ← generator
├── scripts/validate-feed.mjs           ← Direct Publisher schema checker
├── feed.json                           ← output (committed for review)
└── package.json                        ← npm scripts only; no dependencies
```

## Running it

Requires Node ≥ 18 (already on the dev machine — no `npm install` needed,
zero dependencies).

```sh
cd roku-channel
npm run build      # records/ → feed.json
npm run validate   # schema-check feed.json (exits non-zero on errors)
npm run all        # build then validate
```

The generator:

- reads every `records/<record_id>/metadata.json`,
- validates each record against the schema contract in `AGENTS.md`,
- maps each one to a Direct Publisher `shortFormVideos` item using the
  record's pre-mapped `roku.*` block as authoritative
  (`record.roku.playback.url` overrides any derived URL — segments with
  `clip_required: true` already carry their own Mux clip playback ID),
- sorts items by `releaseDate` ASC then `record_id` ASC so regenerations
  produce diff-able output,
- emits browsable rows: one `categories` row per `content_type` plus a
  curated **ʻŌlelo Hawaiʻi** row pulling any record with
  `has_olelo_hawaii: true`.

Item `id`s are the `record_id`, which is stable across regenerations — Roku
uses `id` to track watch progress per device, so changing it would erase
viewer progress for that title.

## What the validator catches

The validator goes beyond a JSON syntax check; it enforces the things Roku
certification reviewers actually reject feeds for:

- missing `providerName`, `language`, `lastUpdated`
- duplicate item `id`s (resets watch progress)
- `shortDescription` > 200 chars / `longDescription` > 500 chars
- non-`https://` thumbnail or video URLs
- thumbnails smaller than 800×450 or not 16:9 (warning, since Mux smartcrop
  URLs encode size as query params — easy to confirm)
- `releaseDate` not `YYYY-MM-DD`, `dateAdded` / `lastUpdated` not ISO 8601
- `videoType` outside `HLS|DASH|SMOOTH|MP4|MOV|M4V`
- `quality` outside `SD|HD|FHD|UHD`
- unknown `genres` (warning — Roku's genre vocabulary evolves)
- `playlists[].itemIds[]` referencing ids that don't exist in
  `shortFormVideos`
- `categories[].playlistName` referencing playlists that don't exist

Run it after every regeneration. CI hook is on the Stage 2 todo list.

## Mock records included

| record_id                            | content_type | notes                                                  |
| ------------------------------------ | ------------ | ------------------------------------------------------ |
| `19700816-hoolaulea-o-hana`          | cultural     | `has_olelo_hawaii: true`                               |
| `19850712-honoka-na-mele`            | music        |                                                        |
| `19920304-maui-county-fair-psa`      | community    | very short (~60s)                                      |
| `20010922-pacific-talk-makaha`       | talk_show    |                                                        |
| `20191108-na-leo-news-segment`       | news         | `clip_required: true` — Mux clip asset playback ID     |

The `mux_playback_id` values are obviously fake (`MOCK1…`/`MOCK2…`) — replace
with real public playback IDs from the catalog project before publishing.

## Hosting the feed

Direct Publisher fetches the feed over **public HTTPS** at an interval Roku
controls (~15 min during channel setup, then up to 24 h once published).
Roku does *not* authenticate; the URL must be reachable without cookies or
headers. Roku also requires a valid TLS chain — self-signed certs fail.

Three reasonable hosts:

- **Vercel** (this repo already deploys to Vercel — see `.vercel/`). The
  simplest pattern: copy/symlink `roku-channel/feed.json` into the Next.js
  app's `public/` and let Vercel serve it at
  `https://<deployment>/roku/feed.json`. Long-term you probably want a
  build step that runs `node roku-channel/scripts/build-feed.mjs` and
  outputs into `public/roku/feed.json` so each deploy gets a fresh feed.
- **GitHub Pages** on a small static repo if you want feed publishing
  decoupled from the Next.js app's deploy cycle.
- **S3 + CloudFront** if you'd rather the file live next to the Mux assets.
  Set `Cache-Control: public, max-age=300` so updates propagate within a
  few minutes without hammering origin.

Pick one and pin the URL — Roku stores the feed URL in the channel config
and changing it later requires re-submission for certification.

## Creating the Roku channel (one-time, manual)

1. **Sign up** for a [Roku developer account][rokudev] using
   `tech@akaku.org` (or a shared org address — personal accounts can lose
   access during staff turnover).
2. From the developer dashboard, **Manage My Channels → Add Channel →
   Direct Publisher**.
3. Choose channel name `Akakū Community Archive`, category
   `News & Weather` or `Special Interest`, language `en`, region `US`.
4. **Feed URL**: paste the public HTTPS URL from the hosting step above.
5. Upload branding assets to the dashboard:
   - **HD channel poster** 540×405 (PNG, transparent)
   - **FHD channel poster** 1280×720
   - **Channel icons** 290×218 (focus) and 246×140 (side)
   - **Splash screen** 1920×1080 (FHD) and 1280×720 (HD)
   - These live in `/Graphics/` at the repo root once produced — currently
     not in scope for this folder.
6. Fill the metadata page — short description, long description, support
   contact, privacy policy URL, terms URL. Akakū already has these for
   web; reuse them.
7. **Preview** in the dashboard — Roku spins up a sandbox channel with a
   one-time test code you can side-load to a Roku device via your dev
   account.
8. **Submit for certification**. Typical review: 5–10 business days.
   Common rejection reasons we should pre-check:
   - playable streams (every HLS URL in the feed must play to completion)
   - captions present (HLS manifest carries the WebVTT — confirmed in the
     schema with `captions_in_manifest: true`)
   - working back / select / play / pause from the remote (Direct
     Publisher handles this for us)
   - poster/icon assets present and the right sizes

After certification the channel becomes publicly searchable on Roku.

## Verifying the spec before submission

Roku's Direct Publisher JSON spec evolves. The field shape used here is
the long-stable one
([spec page][dp-json-spec], [GitHub mirror][rokudev-specs]) and matches
the schema in `AGENTS.md`, but before you submit re-check:

- top-level: `providerName`, `language`, `lastUpdated`, `shortFormVideos`,
  optional `categories`, optional `playlists`
- item: `id`, `title`, `shortDescription` (≤200), `longDescription`
  (≤500), `thumbnail`, `releaseDate`, `tags`, `genres`, `content`
- `content`: `dateAdded`, `duration` (integer seconds), `language`,
  `videos[]`
- `videos[]`: `url`, `quality`, `videoType`

If Roku adds a new required field, the validator will fail silently on it
— add the rule to `scripts/validate-feed.mjs` and regenerate.

## Gotchas (from `AGENTS.md`, re-stated for the reviewer)

- All archive items are mapped to `shortFormVideos` (no MPAA rating
  field needed). Switch a record to `movies` only if you genuinely want
  the richer detail page UI for one long single program.
- `id` MUST be stable across regenerations — we use `record_id` for this.
- Thumbnails: HTTPS, 16:9, ≥ 800×450. The Mux image URL
  (`width=1280&height=720`) satisfies this.
- Captions are inside the HLS manifest; do not list separate caption
  files. Roku surfaces them automatically.
- `has_olelo_hawaii: true` records may caption poorly because Mux has no
  Hawaiian model. The curated **ʻŌlelo Hawaiʻi** row exists so viewers can
  find these intentionally, not stumble onto them expecting accurate
  English captions.
- Segments (`clip_required: true`) get their own HLS URL from a Mux clip
  asset created by the catalog project. The generator treats
  `roku.playback.url` as authoritative — don't try to derive a clipped URL
  from start/end times.
- Hawaiian language and place names are preserved exactly (ʻokina + kahakō).
  Do not anglicize titles, tags, or descriptions.

## Stage 2 (deferred, do not start yet)

Once the Direct Publisher channel is certified and live, the follow-up is
a native SceneGraph (BrightScript) channel that consumes the same
`records/` catalog with custom Akakū branding plus the Roku Mux Data SDK.

- Mux Data env key (client-side, safe to embed; **not** an API secret):
  `0gjatkrb5antr7d70tl0bn1oo`
- Reuse `feed.json` as the catalog source from the SceneGraph channel —
  no second data pipeline.
- Akakū's paid "Maui Stream" platform is **out of scope** — public free
  archive only.

Don't begin Stage 2 until Stage 1 is in cert and we've learned what UX
gaps Direct Publisher actually has for this archive.

[dp-overview]: https://developer.roku.com/docs/direct-publisher/getting-started.md
[dp-json-spec]: https://developer.roku.com/docs/specs/direct-publisher-feed-specs/json-dp-spec.md
[rokudev]: https://developer.roku.com/
[rokudev-specs]: https://github.com/rokudev/feed-specifications
