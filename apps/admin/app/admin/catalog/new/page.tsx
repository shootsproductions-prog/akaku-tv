"use client";

import * as UpChunk from "@mux/upchunk";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  CONTENT_TYPES,
  deriveRecordId,
  type ContentType,
} from "@/lib/records";

type UploadState =
  | { kind: "idle" }
  | { kind: "requesting_url" }
  | { kind: "uploading"; progress: number; uploadId: string }
  | { kind: "processing"; uploadId: string; muxStatus: string; attempt: number }
  | {
      kind: "ready";
      uploadId: string;
      assetId: string;
      playbackId: string;
      durationSeconds: number;
      aspectRatio: string | null;
    }
  | { kind: "upload_error"; message: string };

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; recordId: string; path: string }
  | { kind: "save_error"; message: string };

type UploadStatusResponse = {
  state?: string;
  uploadId?: string;
  assetId?: string;
  playbackId?: string | null;
  durationSeconds?: number | null;
  aspectRatio?: string | null;
  error?: string;
};

const POLL_INTERVAL_MS = 4000;
const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  news: "News",
  cultural: "Cultural",
  music: "Music",
  community: "Community",
  sports: "Sports",
  talk_show: "Talk show",
  other: "Other",
};

const today = () => new Date().toISOString().slice(0, 10);

export default function NewCatalogEntryPage() {
  const [upload, setUpload] = useState<UploadState>({ kind: "idle" });
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState<ContentType>("cultural");
  const [tagsRaw, setTagsRaw] = useState("");
  const [hasOleloHawaii, setHasOleloHawaii] = useState(false);
  const [estimatedDate, setEstimatedDate] = useState(today());
  const [thumbnailTimeRaw, setThumbnailTimeRaw] = useState("");

  const tags = useMemo(
    () =>
      tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsRaw]
  );

  const derivedRecordId = useMemo(() => {
    if (!title || !estimatedDate) return null;
    try {
      return deriveRecordId(estimatedDate, title);
    } catch {
      return null;
    }
  }, [title, estimatedDate]);

  const formValid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(estimatedDate) &&
    derivedRecordId !== null;

  const canSave = upload.kind === "ready" && formValid && save.kind !== "saving";

  const pollUntilReady = useCallback(async (uploadId: string) => {
    let attempt = 0;
    while (true) {
      attempt += 1;
      const res = await fetch(`/api/mux/upload-status?uploadId=${encodeURIComponent(uploadId)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as UploadStatusResponse;
      if (!res.ok || data.error) {
        setUpload({ kind: "upload_error", message: data.error ?? `Status check HTTP ${res.status}` });
        return;
      }
      if (data.state === "ready" && data.assetId && data.playbackId && data.durationSeconds) {
        setUpload({
          kind: "ready",
          uploadId,
          assetId: data.assetId,
          playbackId: data.playbackId,
          durationSeconds: data.durationSeconds,
          aspectRatio: data.aspectRatio ?? null,
        });
        return;
      }
      setUpload({ kind: "processing", uploadId, muxStatus: data.state ?? "unknown", attempt });
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUpload({ kind: "requesting_url" });
      setSave({ kind: "idle" });

      let resolvedUploadId: string | null = null;

      const chunked = UpChunk.createUpload({
        endpoint: async () => {
          const res = await fetch("/api/mux/upload-url", { method: "POST" });
          const data = (await res.json()) as { uploadId?: string; url?: string; error?: string };
          if (!res.ok || !data.url || !data.uploadId) {
            throw new Error(data.error ?? `Failed to get upload URL (HTTP ${res.status})`);
          }
          resolvedUploadId = data.uploadId;
          setUpload({ kind: "uploading", progress: 0, uploadId: data.uploadId });
          return data.url;
        },
        file,
        chunkSize: 30720,
      });

      chunked.on("error", (event: CustomEvent<{ message: string }>) => {
        setUpload({ kind: "upload_error", message: event.detail.message });
      });
      chunked.on("progress", (event: CustomEvent<number>) => {
        if (!resolvedUploadId) return;
        setUpload({ kind: "uploading", progress: event.detail, uploadId: resolvedUploadId });
      });
      chunked.on("success", () => {
        if (!resolvedUploadId) return;
        setUpload({
          kind: "processing",
          uploadId: resolvedUploadId,
          muxStatus: "waiting",
          attempt: 0,
        });
        void pollUntilReady(resolvedUploadId);
      });
    },
    [pollUntilReady]
  );

  const onSave = useCallback(async () => {
    if (upload.kind !== "ready") return;
    setSave({ kind: "saving" });

    const thumbnailTime = thumbnailTimeRaw.trim() === "" ? undefined : Number(thumbnailTimeRaw);
    if (thumbnailTime !== undefined && (Number.isNaN(thumbnailTime) || thumbnailTime < 0)) {
      setSave({ kind: "save_error", message: "Thumbnail time must be a non-negative number" });
      return;
    }

    const res = await fetch("/api/catalog/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        producer: {
          title: title.trim(),
          description: description.trim(),
          contentType,
          tags,
          hasOleloHawaii,
          estimatedDate,
          thumbnailTime,
        },
        mux: {
          playbackId: upload.playbackId,
          durationSeconds: upload.durationSeconds,
        },
      }),
    });

    const data = (await res.json()) as {
      recordId?: string;
      path?: string;
      error?: string;
    };

    if (!res.ok || !data.recordId || !data.path) {
      setSave({ kind: "save_error", message: data.error ?? `Save failed (HTTP ${res.status})` });
      return;
    }
    setSave({ kind: "saved", recordId: data.recordId, path: data.path });
  }, [upload, title, description, contentType, tags, hasOleloHawaii, estimatedDate, thumbnailTimeRaw]);

  const reset = useCallback(() => {
    setUpload({ kind: "idle" });
    setSave({ kind: "idle" });
    setTitle("");
    setDescription("");
    setContentType("cultural");
    setTagsRaw("");
    setHasOleloHawaii(false);
    setEstimatedDate(today());
    setThumbnailTimeRaw("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  if (save.kind === "saved") {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-12 text-zinc-900 dark:text-zinc-100">
        <h1 className="text-2xl font-semibold tracking-tight">Record saved</h1>
        <div className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/40">
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[max-content_1fr] sm:gap-x-4">
            <dt className="text-zinc-500">record_id</dt>
            <dd className="font-mono">{save.recordId}</dd>
            <dt className="text-zinc-500">File</dt>
            <dd className="font-mono break-all">{save.path}</dd>
          </dl>
          <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
            Run <code className="font-mono">npm run all</code> in <code>roku-channel/</code> to
            regenerate <code>feed.json</code> with this record included.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          New record
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 text-zinc-900 dark:text-zinc-100">
      <h1 className="text-2xl font-semibold tracking-tight">New catalog entry</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Fill the metadata while Mux ingests the upload. The record is written to
        <code className="mx-1">roku-channel/records/&lt;record_id&gt;/metadata.json</code>
        when both finish.
      </p>

      <section className="mt-8 space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Hoʻolauleʻa O Hāna (1970)"
            className="input"
          />
        </Field>

        <Field label="Description" required hint="≤200 chars goes to Roku short_description; full text becomes long_description (clamped to 500).">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input font-sans"
            placeholder="Community celebration in Hāna featuring hula hālau…"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Content type" required>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="input"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CONTENT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estimated date" required hint="YYYY-MM-DD. Becomes Roku releaseDate.">
            <input
              type="date"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Tags" hint="Comma-separated. Hawaiian diacritics preserved.">
          <input
            type="text"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="Hāna, hoʻolauleʻa, hula, kūpuna, oli"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <Field label="Thumbnail time (s)" hint="Optional. Defaults to min(60, duration/2).">
            <input
              type="number"
              min={0}
              step={0.5}
              value={thumbnailTimeRaw}
              onChange={(e) => setThumbnailTimeRaw(e.target.value)}
              className="input"
              placeholder="auto"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasOleloHawaii}
              onChange={(e) => setHasOleloHawaii(e.target.checked)}
              className="h-4 w-4"
            />
            Contains ʻōlelo Hawaiʻi
          </label>
        </div>

        <p className="text-xs text-zinc-500">
          Will write{" "}
          <code className="font-mono">
            {derivedRecordId ? `${derivedRecordId}/metadata.json` : "—"}
          </code>
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {upload.kind === "idle" && (
          <label className="flex flex-col gap-3">
            <span className="text-sm font-medium">Video file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={onFileChange}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 dark:file:bg-zinc-100 dark:file:text-zinc-900"
            />
          </label>
        )}

        {upload.kind === "requesting_url" && <p className="text-sm">Requesting upload URL…</p>}

        {upload.kind === "uploading" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading to Mux…</span>
              <span className="tabular-nums">{upload.progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-zinc-900 transition-[width] dark:bg-zinc-100"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
        )}

        {upload.kind === "processing" && (
          <div className="space-y-2 text-sm">
            <p>Upload complete. Mux is processing the asset…</p>
            <p className="text-xs text-zinc-500">
              status: <code>{upload.muxStatus}</code> · poll #{upload.attempt}
            </p>
          </div>
        )}

        {upload.kind === "ready" && (
          <div className="space-y-3 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              Asset ready — playback {upload.playbackId}
            </p>
            <p className="text-xs text-zinc-500">
              duration {upload.durationSeconds}s · {upload.aspectRatio ?? "?"}
            </p>
          </div>
        )}

        {upload.kind === "upload_error" && (
          <p className="text-sm text-red-700 dark:text-red-400">
            Upload failed: {upload.message}
          </p>
        )}
      </section>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {save.kind === "saving" ? "Saving…" : "Save record"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Reset
        </button>
        {!formValid && upload.kind === "ready" && (
          <span className="text-xs text-zinc-500">Fill required fields to enable save</span>
        )}
        {upload.kind !== "ready" && formValid && (
          <span className="text-xs text-zinc-500">Waiting for Mux asset…</span>
        )}
      </div>

      {save.kind === "save_error" && (
        <p className="mt-4 text-sm text-red-700 dark:text-red-400">Save failed: {save.message}</p>
      )}
    </main>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}
