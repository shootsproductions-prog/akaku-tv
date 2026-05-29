# Akakū catalog (admin)

Producer-facing Next.js app for the Akakū TV pipeline. Currently provides
direct-to-Mux video upload; the producer metadata form and the records.json
writer are next.

Future home: `tv.akaku.org` (Vercel). For now, runs locally.

## Quickstart

```sh
cd apps/admin
cp .env.example .env.local   # then paste real Mux creds from 1Password
npm install                  # only the first time
npm run dev
```

Open `http://localhost:3000/admin/catalog/new`, pick a video file, and watch it
land in Mux. The page surfaces the resulting `assetId`, public `playbackId`,
duration, and aspect ratio.

## Required env vars

See `.env.example`. The real values come from
1Password → **Akakū — Mux Archive token**.

| Var                            | Where it's used                            |
| ------------------------------ | ------------------------------------------ |
| `MUX_TOKEN_ID`                 | Server only. Mints upload URLs.            |
| `MUX_TOKEN_SECRET`             | Server only. Mints upload URLs.            |
| `NEXT_PUBLIC_MUX_DATA_ENV_KEY` | Client. Stage 2 native SceneGraph only.    |
| `MUX_WEBHOOK_SIGNING_SECRET`   | Server. Added in Step 6 of the Mux setup.  |

`.env.local` is gitignored. `.env.example` is committed via an explicit negation
in `.gitignore`.

## What the upload route does

`POST /api/mux/upload-url` calls `mux.video.uploads.create` with:

- `cors_origin` = the request's `Origin` header (so the browser PUTs succeed).
- `playback_policies: ["public"]` — Roku Direct Publisher requires unauthenticated playback.
- `video_quality: "basic"` — cheaper tier; appropriate for archive content. Switch
  to `plus` per-asset later if a piece warrants it.
- `generated_subtitles: [{ language_code: "en", name: "English (auto)" }]` —
  English auto-captions. ʻŌlelo Hawaiʻi content needs human review afterward.

Returns `{ uploadId, url }`. The browser uses [@mux/upchunk](https://github.com/muxinc/upchunk)
to PUT the file directly to `url` in 30 MB chunks — the server never touches the bytes.

`GET /api/mux/upload-status?uploadId=…` polls the Mux Upload → Asset chain and
returns `{ state, assetId, playbackId, durationSeconds, aspectRatio }` once the
asset is `ready`.

## What this app does not yet do

- Producer metadata form (title, content_type, tags, has_olelo_hawaii, …).
- Writing `roku-channel/records/<record_id>/metadata.json` on submit.
- Postgres + Drizzle for the records table (HANDOFF step 3).
- Mux webhook handler (deferred — see `roku-channel/docs/mux-account-setup.md`
  step 6).
- Auth. Right now anyone who can reach the app can mint upload URLs. Add auth
  before deploying anywhere reachable from the public internet.
