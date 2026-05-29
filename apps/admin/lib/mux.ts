import Mux from "@mux/mux-node";

declare global {
  var __muxClient: Mux | undefined;
}

// Lazy — never throws at module load, so a missing env var produces a
// clean JSON 500 from the route handler instead of Next's HTML error page.
export function getMux(): Mux {
  if (globalThis.__muxClient) return globalThis.__muxClient;

  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error(
      "Mux credentials missing: set MUX_TOKEN_ID and MUX_TOKEN_SECRET in apps/admin/.env.local and restart `npm run dev`."
    );
  }

  globalThis.__muxClient = new Mux({ tokenId, tokenSecret });
  return globalThis.__muxClient;
}

export function muxEnvLoaded(): boolean {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}
