# Akakū TV pipeline — handoff to the new repo

Drop this file at the **root of the new Akakū repo** (next to the
imported `roku-channel/` folder). When you start a fresh Claude Code
session scoped to the new repo, paste this whole file into your first
message — it carries forward every decision and the current state so we
don't reset.

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
