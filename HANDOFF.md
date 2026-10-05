# Akakū TV pipeline — handoff to the new repo

Drop this file at the **root of the new Akakū repo** (next to the
imported `roku-channel/` folder). When you start a fresh Claude Code
session scoped to the new repo, paste this whole file into your first
message — it carries forward every decision and the current state so we
don't reset.

---

## Update — 2026-10-05 (session 4): mobile app

New `apps/mobile/`: an Expo / React Native app (iOS + Android) built from
the Claude Design "Akakū App" handoff. It has the Live, Meetings (County
Watch / Akakū Intelligence), Videos, Radio and Support tabs, dark/light,
Kūpuna large-type mode, and AirPlay (iOS) / Cast (Android). It runs on
demo data behind typed seams. The Castus `hls_url`s needed for Roku also
light up the in-app player. See `apps/mobile/README.md` for what is wired
and what is still mocked.

---

## Update — 2026-10-05 (session 3): pivot to live-first

After a ~4-month pause we revisited the direction. Big change: **the Roku
channel is now live-first, not archive-first.** Rationale: Akakū is
fundamentally a live PEG broadcaster, the cable feed is the mission, and
Akakū's playout already runs on **Castus** (`cloud.castus.tv/vod/akaku/…`)
which outputs HLS on its own. Routing the existing live cable broadcast
to Roku is a shorter path to a shipped channel than building a VOD
catalog + producer upload flow.

What this changes in the plan:

- **The Roku channel surfaces three live tiles**, one per Spectrum PEG
  channel: 53 (Government), 54 (Educational), 55 (Community). Castus
  provides the HLS endpoint for each; our feed just points at them.
- **VOD / archive becomes Stage 1.5** — the records/ + feed-generator
  pipe still works and can be re-enabled by dropping real
  `records/<id>/metadata.json` files in whenever we want. The 5 mock
  records are kept as fixtures for now; delete them before Roku cert
  submission.
- **The `apps/admin/` catalog uploader is paused.** It works end-to-end
  as of session 2 (producer form + direct-to-Mux + records writer), but
  isn't on the critical path for the live-first launch. Pick it back up
  when there's a real producer workflow asking for it.
- **Mux Live is NOT needed** — Castus already handles live encoding
  and HLS delivery. The Mux account is still useful for VOD if/when we
  revive the archive flow.

Code changes shipped this session:

- `roku-channel/live-channels/{53,54,55}.json` — one source file per
  channel. Each carries the Castus player URL (for reference), plus
  `TODO:` placeholders for `hls_url` and `thumbnail_url` that the
  generator refuses to emit a feed with. Name fields are
  `name_todo_verify` — Vini to confirm the official channel assignments.
- `scripts/build-feed.mjs` — now loads `live-channels/*.json` and emits
  Roku `liveFeeds`, in addition to the existing `shortFormVideos`
  from records. Fails cleanly if either input dir is empty.
- `scripts/validate-feed.mjs` — new `checkLiveFeed` enforces the DP
  cert rules on live entries (https URL, HLS/DASH only, no TODO
  placeholders, description caps, 16:9 thumbnail requirement).
- `README.md` — updated to document the live-first path alongside VOD.

Immediate blocker (small): need the **direct `.m3u8` URLs** for each of
the three Castus channels. Either from Castus admin's channel-stream
settings page, or sniffed from the player URL via browser DevTools
(Network tab → filter `m3u8` → refresh). Also need three channel-poster
images (1280×720) hosted somewhere public.

Once those land, `npm run all` in `roku-channel/` goes green and we
have a submittable live-first feed. Remaining launch work after that is
hosting the feed, Roku dev account setup, channel art bundle for the
Roku dashboard, and cert submission.

---

## Update — 2026-05-29 (session 2)

- Repo bootstrapped: 2-commit history from the prior session imported via
  `git am`; HANDOFF.md committed at root.
- `npm run all` in `roku-channel/` passes clean (5 videos, 0 warnings,
  0 errors).
- **Mux credentials received** — Akakū Archive token (Production env)
  with `Mux Video: R+W` and `Mux Data: R`. Stored in `.env.local` at the
  repo root (gitignored). `.env.example` committed as the template. The
  immediate blocker below is cleared; the next blocker is decision #4
  (where the catalog/upload app lives).
- Session containers are ephemeral — when this session ends, `.env.local`
  goes with it. The token must also be stored in 1Password under
  "Akakū — Mux Archive token" so it survives across sessions and
  developers. Producer to confirm that's done.

---

## Who & what

I'm **Vini**, producer at **Akakū Maui Community Media** (PEG / community
media org on Maui). I'm modernizing Akakū's distribution — they've been
stuck in the cable-TV era. Goal: put Akakū on the major Smart TV
platforms starting with **Roku**, then Apple TV, then FireTV / Android TV.

Akakū has:
- ~367-program finished archive (1970–2026, ~125 h, on Mux with public
  playback IDs — masters are managed by a parallel "catalog" project not
  in this repo)
- A working newsroom: reporters, editors, programmers producing a
  **daily news show** plus ongoing event/political/cultural coverage
- A growing **YouTube channel** (parallel distribution — not the source
  of truth)

## Strategic decisions already made

1. **Stage 1 ships as a free Direct Publisher channel on Roku.**
   Fastest cert path (~5–10 business days vs. months for SVOD). Free is
   also right for the PEG mission and lets us build audience before
   gating anything.

2. **Stage 2 adds a sustaining-member tier via Roku Pay** (~$3.99–$5.99/mo)
   unlocking premium / member-only content, early access, ad-free, full
   archive search. Daily news + core cultural programming stays **free
   forever**. Requires a **native SceneGraph (BrightScript)** channel —
   Direct Publisher's commerce flow is too limited. Stage 2 also adds
   Apple TV.

3. **Mux is the source of truth for TV.** Roku and Apple TV will not
   accept YouTube URLs in their feeds — `videoType` has to be a stream we
   control (HLS/DASH/MP4). YouTube stays as a **parallel distribution
   channel** for the YouTube audience + ad revenue + akaku.org embed.
   Producers upload masters once; catalog tool fans out to Mux (primary)
   and YouTube (secondary, via YouTube Data API v3).

4. **Producer catalog tool lives in the akaku.org Next.js app**
   (decision made when that was the plan). ⚠️ Re-verify: this decision
   assumed akaku.org already runs on Next.js. **Confirm what akaku.org
   actually runs on before building.** If it's WordPress/Drupal/etc., we
   either (a) spin up a separate small Next.js admin app at e.g.
   `tv.akaku.org`, or (b) integrate with the existing CMS — likely not
   worth it. Path (a) is the recommendation.

5. **Mux Data env key** (Stage 2 only, client-side, safe to embed —
   NOT an API secret): `0gjatkrb5antr7d70tl0bn1oo`.

## Current state of the code (in `roku-channel/`)

- **`roku-channel/scripts/build-feed.mjs`** — reads
  `records/<id>/metadata.json` files, emits a valid Direct Publisher
  `feed.json`. Pure Node, zero deps. Deterministic ordering for diff-able
  regenerations. Builds categories (one row per content_type) + a curated
  **ʻŌlelo Hawaiʻi** row.
- **`roku-channel/scripts/validate-feed.mjs`** — schema-checks
  `feed.json` against Direct Publisher cert-blocking rules: unique stable
  ids, ≤200/≤500 description caps, https + ≥800×450 16:9 thumbnails, ISO
  8601 timestamps, allowed `videoType`/`quality`, playlist/category
  cross-refs. Caught 4/4 deliberately-injected breaks during testing.
- **`roku-channel/records/`** — 5 mock records spanning cultural+
  `has_olelo_hawaii`, music, community, talk_show, and a `clip_required`
  news segment. Replace the `MOCK*` playback IDs with real Mux IDs from
  Akakū's archive when ready.
- **`roku-channel/feed.json`** — generated output, committed for review.
- **`roku-channel/README.md`** — overview + hosting options + Roku dev
  account + Direct Publisher setup + certification submission guide +
  re-verification checklist for the Roku spec (which evolves).
- **`roku-channel/docs/mux-account-setup.md`** — one-pager for whoever
  owns Akakū's Mux account: account confirmation, least-privilege API
  token minting, playback policy defaults, captioning notes, deferred
  webhook setup, secure credential hand-off.

## Immediate blocker

**Mux API credentials.** Need:
- Mux **Token ID** + **Token Secret** with `Mux Video: Read + Write` and
  `Mux Data: Read` permissions
- Confirmation we're in the **Production** environment (not Sandbox)
- Mux account email if Akakū has multiple accounts

Hand-off via 1Password share, Signal, or paste straight into
`.env.local` together. Not via email or Slack.

Full prep checklist for the Mux account holder is at
`roku-channel/docs/mux-account-setup.md` — give it to whoever owns the
Mux account.

## What's next (in order, once Mux keys land)

1. **Install Mux SDK in the akaku.org Next.js app** (or new admin app
   per decision #4 above).
2. **Build `/admin/catalog/new`** — producer picks a video file, browser
   uploads directly to Mux via a one-time signed upload URL (server only
   mints the URL, never proxies bytes), kicks off English auto-captions,
   sets `public` playback policy.
3. **Drizzle schema** for `records`, `series` (for the daily news show),
   `clips` (for segments), `users` with roles
   (reporter / editor / admin). The existing JSON contract in
   `AGENTS.md` becomes the Postgres schema.
4. **Hand-upload 5–10 launch programs** to Mux (mix: 2–3 recent news, 1–2
   cultural, 1 music, 1 PSA, 1 ʻōlelo Hawaiʻi piece). These go through
   the new flow as the first real-data smoke test.
5. **Host the feed** at `akaku.org/roku/feed.json` (or `tv.akaku.org/feed.json`).
   Either a Next.js API route querying Postgres on demand with HTTP
   caching, or a build-time write to `public/`.
6. **Set up the Roku developer account** (use `tech@akaku.org`, not a
   personal email), create the Direct Publisher channel, point at the
   feed, produce channel art (poster 1280×720, icon 290×218, splash
   1920×1080), preview side-loaded to a real Roku, submit for cert.

## Side things (parallel, not blocking)

- **akaku.org domain access** — for serving the feed + admin routes.
- **YouTube Partner Program** — if Akakū's channel isn't monetized yet
  and qualifies (1k subs + 4k watch hours/yr, or 10M Shorts views/90d),
  turn it on. Free money for a PEG nonprofit.
- **Channel art design** — Roku needs poster + icon + splash; not blocking
  preview but needed for cert submission.
- **Privacy policy + terms URLs** — Roku cert requires both. Reuse the
  existing akaku.org pages.

## What this repo should NOT contain

- Nothing related to the **CyclingHawaii** project. This work was
  originally started in a `cyclinghawaii` repo by mistake — the harness
  scoped that session to a single repo and we worked around it. The
  Akakū code lives here cleanly now.

## How to import the export

You should also have received from the previous session:
- `akaku-tv.tar.gz` — flat tarball of `roku-channel/`. Simplest import:
  ```sh
  cd path/to/new-repo
  tar -xzf path/to/akaku-tv.tar.gz
  git add .
  git commit -m "Import Akakū Roku Direct Publisher feed generator from prior session"
  ```
- `akaku-tv.bundle` — git bundle preserving the 2-commit history if
  preferred.
- `patches/*.patch` — if layering onto an existing branch via `git am`.

Drop this HANDOFF.md at the repo root, commit it alongside the import,
and you're caught up.

---

*Last updated: end of session in `shootsproductions-prog/cyclinghawaii`
on branch `claude/vibrant-einstein-bdZ5e`, May 2026.*
