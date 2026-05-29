import { NextRequest, NextResponse } from "next/server";
import { mux } from "@/lib/mux";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return NextResponse.json(
      { error: "Missing Origin header on upload-url request" },
      { status: 400 }
    );
  }

  try {
    const upload = await mux.video.uploads.create({
      cors_origin: origin,
      new_asset_settings: {
        playback_policies: ["public"],
        video_quality: "basic",
        inputs: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English (auto)",
              },
            ],
          },
        ],
      },
    });

    return NextResponse.json({
      uploadId: upload.id,
      url: upload.url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Mux error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
