#!/usr/bin/env node
// Builds a Roku Direct Publisher JSON feed from records/<record_id>/metadata.json.
//
// Spec reference: https://developer.roku.com/docs/specs/direct-publisher-feed-specs/json-dp-spec.md
// (Roku has been stable on these field names for years; re-check before submitting
//  for certification — the README has the verification checklist.)

import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const RECORDS_DIR = join(ROOT, "records");
const OUTPUT_FILE = join(ROOT, "feed.json");

// Per the AGENTS spec from the catalog project.
const CONTENT_TYPE_TO_GENRES = {
  news: ["news"],
  cultural: ["special", "documentary"],
  music: ["music"],
  community: ["special"],
  sports: ["sports"],
  talk_show: ["talk"],
  other: ["special"],
};

// Human-readable row labels for the optional category UI rows.
const CONTENT_TYPE_ROW_NAME = {
  news: "Local News",
  cultural: "Hawaiian Culture",
  music: "Music",
  community: "Community",
  sports: "Sports",
  talk_show: "Talk Shows",
  other: "More from the Archive",
};

const PROVIDER_NAME = "Akakū Community Media";
const FEED_LANGUAGE = "en";

const isIsoDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

function clamp(text, max) {
  if (!text) return "";
  if (text.length <= max) return text;
  // Leave a marker so a human notices something was truncated.
  return text.slice(0, max - 1).trimEnd() + "…";
}

function isoFromDate(d) {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function loadRecords() {
  const entries = await readdir(RECORDS_DIR, { withFileTypes: true });
  const records = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const path = join(RECORDS_DIR, entry.name, "metadata.json");
    let raw;
    try {
      raw = await readFile(path, "utf8");
    } catch (err) {
      if (err.code === "ENOENT") continue;
      throw err;
    }
    const data = JSON.parse(raw);
    const st = await stat(path);
    records.push({ folder: entry.name, path, data, mtime: st.mtime });
  }
  return records;
}

function assertRecord({ folder, data }) {
  const required = [
    "record_id",
    "mux_playback_id",
    "title",
    "content_type",
    "duration_seconds",
    "roku",
  ];
  for (const k of required) {
    if (data[k] === undefined || data[k] === null) {
      throw new Error(`records/${folder}: missing required field "${k}"`);
    }
  }
  if (data.record_id !== folder) {
    throw new Error(
      `records/${folder}: record_id "${data.record_id}" does not match folder name`
    );
  }
  const r = data.roku;
  if (!r.playback?.url || !r.thumbnail_url || !r.release_date) {
    throw new Error(`records/${folder}: roku.playback.url / thumbnail_url / release_date required`);
  }
  if (!isIsoDate(r.release_date)) {
    throw new Error(`records/${folder}: roku.release_date must be YYYY-MM-DD`);
  }
  if (!CONTENT_TYPE_TO_GENRES[data.content_type]) {
    throw new Error(`records/${folder}: unknown content_type "${data.content_type}"`);
  }
  if (typeof data.duration_seconds !== "number" || data.duration_seconds <= 0) {
    throw new Error(`records/${folder}: duration_seconds must be a positive number`);
  }
}

function toShortFormVideo({ data, mtime }) {
  const r = data.roku;
  const genres = Array.isArray(r.genres) && r.genres.length
    ? r.genres
    : CONTENT_TYPE_TO_GENRES[data.content_type];

  return {
    id: data.record_id,
    title: data.title,
    shortDescription: clamp(r.short_description || data.description, 200),
    longDescription: clamp(r.long_description || data.description, 500),
    thumbnail: r.thumbnail_url,
    releaseDate: r.release_date,
    tags: Array.isArray(data.tags) ? data.tags : [],
    genres,
    content: {
      dateAdded: isoFromDate(mtime),
      duration: Math.round(data.duration_seconds),
      language: FEED_LANGUAGE,
      videos: [
        {
          url: r.playback.url,
          quality: r.playback.quality || "HD",
          videoType: r.playback.videoType || "HLS",
        },
      ],
    },
  };
}

function buildPlaylistsAndCategories(records) {
  const byType = new Map();
  for (const rec of records) {
    const t = rec.data.content_type;
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push(rec.data.record_id);
  }

  const playlists = [];
  const categories = [];

  // One row per content type that has at least one record. Order matches the
  // CONTENT_TYPE_ROW_NAME map so home-screen ordering is deterministic.
  for (const [type, name] of Object.entries(CONTENT_TYPE_ROW_NAME)) {
    const ids = byType.get(type);
    if (!ids || !ids.length) continue;
    const playlistName = `row_${type}`;
    playlists.push({ name: playlistName, itemIds: ids });
    categories.push({ name, playlistName, order: "manual" });
  }

  // Curated "ʻŌlelo Hawaiʻi" row pulls anything tagged as such across types.
  const oleloIds = records
    .filter((r) => r.data.has_olelo_hawaii === true)
    .map((r) => r.data.record_id);
  if (oleloIds.length) {
    playlists.push({ name: "row_olelo_hawaii", itemIds: oleloIds });
    categories.push({
      name: "ʻŌlelo Hawaiʻi",
      playlistName: "row_olelo_hawaii",
      order: "manual",
    });
  }

  return { playlists, categories };
}

async function main() {
  const records = await loadRecords();
  if (!records.length) {
    throw new Error(`No records found under ${RECORDS_DIR}`);
  }

  // Validate first so a bad record fails the build rather than producing a
  // half-broken feed.
  for (const rec of records) assertRecord(rec);

  // Stable order by release_date asc, record_id asc — keeps the feed diff-able
  // across regenerations.
  records.sort((a, b) => {
    const da = a.data.roku.release_date;
    const db = b.data.roku.release_date;
    if (da !== db) return da < db ? -1 : 1;
    return a.data.record_id < b.data.record_id ? -1 : 1;
  });

  const shortFormVideos = records.map(toShortFormVideo);
  const { playlists, categories } = buildPlaylistsAndCategories(records);

  const feed = {
    providerName: PROVIDER_NAME,
    language: FEED_LANGUAGE,
    lastUpdated: isoFromDate(new Date()),
    shortFormVideos,
    playlists,
    categories,
  };

  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(feed, null, 2) + "\n", "utf8");

  console.log(
    `wrote ${OUTPUT_FILE}: ${shortFormVideos.length} videos, ` +
      `${playlists.length} playlists, ${categories.length} categories`
  );
}

main().catch((err) => {
  console.error("build-feed failed:", err.message);
  process.exit(1);
});
