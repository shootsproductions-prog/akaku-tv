import { NextResponse } from "next/server";
import { muxEnvLoaded } from "@/lib/mux";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Boolean-only — never leaks the credential values themselves.
export async function GET() {
  return NextResponse.json({
    muxEnv: muxEnvLoaded(),
    cwd: process.cwd(),
  });
}
