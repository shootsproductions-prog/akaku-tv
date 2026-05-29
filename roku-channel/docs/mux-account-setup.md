# Mux account setup for the Akakū TV pipeline

This is a one-pager for whoever owns Akakū's Mux account. Once these steps are
done and credentials are handed to dev, we can start wiring uploads through the
catalog and ship the Roku channel.

If you're new to Mux: it's the video infrastructure layer — ingest, transcode,
HLS delivery, captions, analytics. Akakū's Roku channel pulls video directly
from Mux URLs. Same Mux assets will also drive Apple TV, FireTV, and the
akaku.org watch experience later.

---

## Step 1 — Confirm or create the Akakū Mux account

- Use an organizational email, not personal. `tech@akaku.org` or
  `engineering@akaku.org` are good choices. Personal accounts cause real pain
  during staff turnover (we've seen channels lose access this way).
- Mux pricing is pay-as-you-go. As of 2026, roughly:
  - Encoding: about $0.005 per minute of source video, one time per asset.
  - Storage: about $0.003 per minute per month.
  - Delivery: about $0.0012 per minute streamed.
  - **Always check the current pricing page** — these change.
- Rough Akakū estimate: 125 h archive ingest (one-time ~$40) + ~30 min/day
  new content. Monthly delivery cost scales with viewership; budget a few
  hundred dollars per month early, more as Roku/Apple TV audience grows.
- If the account exists already: dashboard top-left has an **Environment**
  dropdown. Confirm we'll be working in the **Production** environment (not
  Development or Sandbox). All credentials in the next step are
  environment-scoped — credentials minted in Development won't see Production
  assets.

## Step 2 — Mint an API access token

This is the credential dev needs.

1. Mux dashboard → **Settings** → **Access Tokens** → **Generate new token**.
2. Permissions: enable
   - **Mux Video** — Read + Write
   - **Mux Data** — Read
   (Leave the rest off. Least privilege.)
3. Name: `akaku-catalog-prod`.
4. Click generate. Mux will show the **Token ID** and **Token Secret** ONCE.
   The secret is never shown again — if you lose it, you regenerate.
5. Save both in a password manager (1Password, Bitwarden — not a sticky
   note). The dev who wires this needs both values.

## Step 3 — Confirm playback policy default

Each Mux asset has a playback policy: `public` (anyone with the playback ID
can stream — the URL is the auth) or `signed` (requires a short-lived JWT to
play, used for paywalled content).

- For Roku Stage 1 (free archive + daily news), default should be **public**.
- For Stage 2 (sustaining-member tier), member-only content will use
  **signed** — but we don't need to set that up yet.
- Check: dashboard → **Settings** → **Environment** → default playback policy.
- If existing assets are in `signed` and we want them on Roku, we'll need to
  add a `public` playback ID to each (Mux allows multiple playback IDs per
  asset, so you don't need to re-ingest).

## Step 4 — Captions

- Mux supports auto-generated English captions on ingest. We'll enable this
  per-upload via the API — no global setting to flip.
- Confirm Akakū's plan tier supports auto-captioning (most do; the smallest
  tiers historically didn't).
- ʻŌlelo Hawaiʻi content: Mux has no Hawaiian model. Auto-captions on
  Hawaiian-heavy material will be inaccurate English approximations. The
  catalog UI will flag these as "needs human review" and surface a caption
  editor in Stage 2.

## Step 5 — Mux Data env key (already have)

The client-side Mux Data environment key `0gjatkrb5antr7d70tl0bn1oo` was
already provided. It's safe to embed in clients — it's not an API secret. No
action needed now; this is for the Stage 2 native Roku channel analytics.

## Step 6 — Webhook (deferred)

Once the catalog tool ships, we'll register a Mux webhook pointed at
`https://akaku.org/api/mux/webhook` so the catalog knows when ingests
complete or fail. Nothing to do today; we'll do this together when we get
there.

## Step 7 — Hand the credentials to dev

Send to the dev wiring the catalog:

- Mux **Token ID** (looks like a UUID)
- Mux **Token Secret** (long base64-ish string)
- Confirmation of which **environment** (should be Production) and the Mux
  account email if there are multiple Akakū accounts.

**Secure channel only.** Acceptable:
- 1Password / Bitwarden shared item
- Signal message
- Handed over in person, typed into the `.env.local` file together

**Not acceptable:** email, Slack DM, plain text in a Google Doc, screenshot in
a Discord. If a credential lands in any of those, regenerate it and start
over — it's not work, it's a 30-second click.

---

## What dev will do once credentials arrive

1. Add Mux env vars to `.env.example` (placeholders) and `.env.local` (real
   values). Vars: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`,
   `MUX_WEBHOOK_SIGNING_SECRET` (added in step 6).
2. Install the official Mux Node SDK (`@mux/mux-node`) in the Next.js app.
3. Build `/admin/catalog/new`: producer picks a file, browser uploads
   **directly to Mux** via a one-time signed upload URL minted by the
   server. Server never proxies the bytes.
4. Wire English auto-captions and `public` playback policy into the
   upload-URL creation call.
5. Drop the first batch of Akakū's launch content through this flow into the
   `records/` table, regenerate the feed, host at `akaku.org/roku/feed.json`,
   and proceed with Roku dev account setup and certification submission.

---

## Questions you'll probably have

**Why not just use YouTube as the video source?** Roku and Apple TV will not
accept YouTube URLs in their channel feeds — those platforms require streams
you control directly. YouTube stays a parallel distribution channel for the
YouTube audience (and ad revenue), but isn't viable as the source of truth.

**Why Mux specifically vs. Vimeo, JW Player, Brightcove?** Mux is API-first
(makes the catalog tool simple), per-minute pay-as-you-go (no $1k/mo
minimums), and supports the exact HLS + caption shape Roku needs without
fighting the platform. Vimeo/Brightcove are CMS-first products built for
people who don't want to write code — we're writing the code, so we want
the cleaner pipes.

**Do we need a separate Mux account for staging/dev?** No. Mux supports
Development and Production environments inside one account. Dev uses
Development for testing, Production for real content. Same account, same
billing, separate credentials and asset stores.
