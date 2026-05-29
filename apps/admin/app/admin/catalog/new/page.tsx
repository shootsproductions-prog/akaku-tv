"use client";

import * as UpChunk from "@mux/upchunk";
import { useCallback, useRef, useState } from "react";

type UploadState =
  | { kind: "idle" }
  | { kind: "requesting_url" }
  | { kind: "uploading"; progress: number; uploadId: string }
  | { kind: "processing"; uploadId: string; muxStatus: string; attempt: number }
  | {
      kind: "ready";
      uploadId: string;
      assetId: string;
      playbackId: string | null;
      durationSeconds: number | null;
      aspectRatio: string | null;
    }
  | { kind: "error"; message: string };

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

export default function NewCatalogEntryPage() {
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pollUntilReady = useCallback(async (uploadId: string) => {
    let attempt = 0;
    while (true) {
      attempt += 1;
      const res = await fetch(`/api/mux/upload-status?uploadId=${encodeURIComponent(uploadId)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as UploadStatusResponse;
      if (!res.ok || data.error) {
        setState({ kind: "error", message: data.error ?? `Status check HTTP ${res.status}` });
        return;
      }
      if (data.state === "ready" && data.assetId) {
        setState({
          kind: "ready",
          uploadId,
          assetId: data.assetId,
          playbackId: data.playbackId ?? null,
          durationSeconds: data.durationSeconds ?? null,
          aspectRatio: data.aspectRatio ?? null,
        });
        return;
      }
      setState({ kind: "processing", uploadId, muxStatus: data.state ?? "unknown", attempt });
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setState({ kind: "requesting_url" });

      let resolvedUploadId: string | null = null;

      const upload = UpChunk.createUpload({
        endpoint: async () => {
          const res = await fetch("/api/mux/upload-url", { method: "POST" });
          const data = (await res.json()) as { uploadId?: string; url?: string; error?: string };
          if (!res.ok || !data.url || !data.uploadId) {
            throw new Error(data.error ?? `Failed to get upload URL (HTTP ${res.status})`);
          }
          resolvedUploadId = data.uploadId;
          setState({ kind: "uploading", progress: 0, uploadId: data.uploadId });
          return data.url;
        },
        file,
        chunkSize: 30720,
      });

      upload.on("error", (event: CustomEvent<{ message: string }>) => {
        setState({ kind: "error", message: event.detail.message });
      });

      upload.on("progress", (event: CustomEvent<number>) => {
        if (!resolvedUploadId) return;
        setState({ kind: "uploading", progress: event.detail, uploadId: resolvedUploadId });
      });

      upload.on("success", () => {
        if (!resolvedUploadId) return;
        setState({
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

  const reset = useCallback(() => {
    setState({ kind: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 text-zinc-900 dark:text-zinc-100">
      <h1 className="text-2xl font-semibold tracking-tight">New catalog entry</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Direct upload to Mux. The file goes straight to Mux storage — this server only
        mints a one-time signed upload URL and never proxies the bytes.
      </p>

      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {state.kind === "idle" && (
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

        {state.kind === "requesting_url" && <p className="text-sm">Requesting upload URL…</p>}

        {state.kind === "uploading" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading to Mux…</span>
              <span className="tabular-nums">{state.progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full bg-zinc-900 transition-[width] dark:bg-zinc-100"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">Upload ID: {state.uploadId}</p>
          </div>
        )}

        {state.kind === "processing" && (
          <div className="space-y-2 text-sm">
            <p>Upload complete. Mux is processing the asset…</p>
            <p className="text-xs text-zinc-500">
              Mux status: <code>{state.muxStatus}</code> · poll #{state.attempt} · upload{" "}
              {state.uploadId}
            </p>
          </div>
        )}

        {state.kind === "ready" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Asset ready
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[max-content_1fr] sm:gap-x-4">
              <dt className="text-zinc-500">Asset ID</dt>
              <dd className="font-mono break-all">{state.assetId}</dd>
              <dt className="text-zinc-500">Playback ID</dt>
              <dd className="font-mono break-all">{state.playbackId ?? "—"}</dd>
              <dt className="text-zinc-500">Duration</dt>
              <dd>{state.durationSeconds != null ? `${state.durationSeconds}s` : "—"}</dd>
              <dt className="text-zinc-500">Aspect ratio</dt>
              <dd>{state.aspectRatio ?? "—"}</dd>
            </dl>
            {state.playbackId && (
              <p className="text-xs text-zinc-500">
                HLS URL:{" "}
                <code className="break-all">
                  https://stream.mux.com/{state.playbackId}.m3u8
                </code>
              </p>
            )}
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Upload another
            </button>
          </div>
        )}

        {state.kind === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-red-700 dark:text-red-400">Upload failed: {state.message}</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Next step (not in this iteration): a producer form for title, content type, tags,
        and ʻōlelo Hawaiʻi flag, which writes{" "}
        <code>roku-channel/records/&lt;record_id&gt;/metadata.json</code> on submit.
      </p>
    </main>
  );
}
