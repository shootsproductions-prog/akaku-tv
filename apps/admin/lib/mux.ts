import Mux from "@mux/mux-node";

declare global {
  var __muxClient: Mux | undefined;
}

function getMuxClient(): Mux {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error(
      "Mux credentials missing: set MUX_TOKEN_ID and MUX_TOKEN_SECRET in apps/admin/.env.local"
    );
  }
  return new Mux({ tokenId, tokenSecret });
}

export const mux: Mux = globalThis.__muxClient ?? (globalThis.__muxClient = getMuxClient());
