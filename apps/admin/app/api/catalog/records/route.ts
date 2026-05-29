import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import {
  CONTENT_TYPES,
  buildRecord,
  type ContentType,
  type ProducerInput,
  type MuxAssetDetails,
} from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// apps/admin/ → ../../roku-channel/records/
const RECORDS_DIR = resolve(process.cwd(), "..", "..", "roku-channel", "records");

type CreateRecordBody = {
  producer?: Partial<ProducerInput> & { contentType?: string };
  mux?: Partial<MuxAssetDetails>;
};

function parseInput(body: CreateRecordBody): {
  producer: ProducerInput;
  mux: MuxAssetDetails;
} {
  const p = body.producer ?? {};
  const m = body.mux ?? {};

  if (!p.title || typeof p.title !== "string") throw new Error("producer.title is required");
  if (!p.description || typeof p.description !== "string") throw new Error("producer.description is required");
  if (!p.contentType || !(CONTENT_TYPES as readonly string[]).includes(p.contentType)) {
    throw new Error(`producer.contentType must be one of ${CONTENT_TYPES.join(", ")}`);
  }
  if (!p.estimatedDate || !/^\d{4}-\d{2}-\d{2}$/.test(p.estimatedDate)) {
    throw new Error("producer.estimatedDate must be YYYY-MM-DD");
  }
  if (p.tags !== undefined && !Array.isArray(p.tags)) throw new Error("producer.tags must be an array");
  if (typeof p.hasOleloHawaii !== "boolean") throw new Error("producer.hasOleloHawaii must be boolean");
  if (p.thumbnailTime !== undefined && (typeof p.thumbnailTime !== "number" || p.thumbnailTime < 0)) {
    throw new Error("producer.thumbnailTime must be a non-negative number");
  }

  if (!m.playbackId || typeof m.playbackId !== "string") throw new Error("mux.playbackId is required");
  if (typeof m.durationSeconds !== "number" || m.durationSeconds <= 0) {
    throw new Error("mux.durationSeconds must be a positive number");
  }

  return {
    producer: {
      title: p.title.trim(),
      description: p.description.trim(),
      contentType: p.contentType as ContentType,
      tags: (p.tags ?? []).map((t) => String(t).trim()).filter(Boolean),
      hasOleloHawaii: p.hasOleloHawaii,
      estimatedDate: p.estimatedDate,
      thumbnailTime: p.thumbnailTime,
    },
    mux: { playbackId: m.playbackId, durationSeconds: m.durationSeconds },
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body: CreateRecordBody;
  try {
    body = (await request.json()) as CreateRecordBody;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseInput(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid input" },
      { status: 400 }
    );
  }

  let record;
  try {
    record = buildRecord(parsed.producer, parsed.mux);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not build record" },
      { status: 400 }
    );
  }

  const recordDir = join(RECORDS_DIR, record.record_id);
  const recordPath = join(recordDir, "metadata.json");

  if (await exists(recordPath)) {
    return NextResponse.json(
      {
        error: `Record "${record.record_id}" already exists. Change the title or estimated date to derive a different record_id.`,
        recordId: record.record_id,
      },
      { status: 409 }
    );
  }

  try {
    await mkdir(recordDir, { recursive: true });
    await writeFile(recordPath, JSON.stringify(record, null, 2) + "\n", "utf8");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to write record" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    recordId: record.record_id,
    path: `roku-channel/records/${record.record_id}/metadata.json`,
  });
}
