import { NextRequest, NextResponse } from "next/server";
import { getMux } from "@/lib/mux";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const uploadId = request.nextUrl.searchParams.get("uploadId");
  if (!uploadId) {
    return NextResponse.json(
      { error: "Missing uploadId query param" },
      { status: 400 }
    );
  }

  try {
    const mux = getMux();
    const upload = await mux.video.uploads.retrieve(uploadId);

    if (upload.status !== "asset_created" || !upload.asset_id) {
      return NextResponse.json({
        state: upload.status,
        uploadId: upload.id,
        ...(upload.error ? { error: upload.error.message ?? upload.error.type } : {}),
      });
    }

    const asset = await mux.video.assets.retrieve(upload.asset_id);
    const publicPlaybackId = asset.playback_ids?.find((p) => p.policy === "public")?.id;

    return NextResponse.json({
      state: asset.status,
      uploadId: upload.id,
      assetId: asset.id,
      playbackId: publicPlaybackId ?? null,
      durationSeconds: asset.duration ?? null,
      aspectRatio: asset.aspect_ratio ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Mux error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
