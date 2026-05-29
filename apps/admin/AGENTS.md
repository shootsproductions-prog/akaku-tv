# Akakū catalog (admin) — agent notes

## Project context

This app is one piece of the Akakū TV pipeline:

- `roku-channel/` (repo root) — Direct Publisher feed generator. Reads per-record
  `metadata.json` files and emits `feed.json`. Zero npm deps.
- `apps/admin/` (you are here) — producer-facing Next.js app. Direct-to-Mux
  uploads now; producer metadata form and `records/<id>/metadata.json` writer
  to come.
- `HANDOFF.md` (repo root) — strategic decisions, current state, next steps.

When in doubt about scope or sequencing, read `HANDOFF.md` first.

## Conventions

- Server-only secrets (`MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`) live in
  `.env.local` (gitignored). Never log them, never put them in client components.
- The Mux client is a singleton in `lib/mux.ts`. Do not instantiate `new Mux(...)`
  elsewhere — it bypasses the env-var error message and the cached instance.
- All Mux uploads are direct (browser → Mux). The server only mints the upload
  URL. Do not introduce a server-side proxy upload path.
- Records that flow through here must satisfy the schema in
  `roku-channel/records/*/metadata.json`. Mismatches will fail the Roku feed
  build.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
