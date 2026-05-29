#!/usr/bin/env node
// Schema-check the generated feed.json against the Direct Publisher contract.
// This is intentionally strict — Roku's certification rejects feeds for
// problems this catches (over-long descriptions, non-https thumbnails,
// duplicate ids, unknown videoType, etc.).
//
// Run after build-feed.mjs:  npm run validate

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FEED_PATH = resolve(HERE, "..", "feed.json");

const ALLOWED_VIDEO_TYPES = new Set(["HLS", "DASH", "SMOOTH", "MP4", "MOV", "M4V"]);
const ALLOWED_QUALITY = new Set(["SD", "HD", "FHD", "UHD"]);
// Long-stable Roku genre vocabulary. Not exhaustive — Roku occasionally adds
// values — so unknown ones produce warnings, not errors.
const KNOWN_GENRES = new Set([
  "action", "adventure", "animals", "animated", "anime", "children",
  "comedy", "crime", "dance", "documentary", "drama", "educational",
  "faith", "family", "fantasy", "fashion", "fitness", "food", "foreign",
  "gaming", "health", "history", "holiday", "horror", "indie", "lifestyle",
  "military", "miniseries", "music", "mystery", "nature", "news",
  "podcast", "reality", "romance", "science", "sci_fi", "special",
  "sports", "talk", "technology", "thriller", "travel", "western",
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

const errors = [];
const warnings = [];

const err = (path, msg) => errors.push(`ERR  ${path}: ${msg}`);
const warn = (path, msg) => warnings.push(`WARN ${path}: ${msg}`);

function requireField(obj, key, path) {
  if (obj[key] === undefined || obj[key] === null || obj[key] === "") {
    err(path, `missing required field "${key}"`);
    return false;
  }
  return true;
}

function checkVideo(v, path) {
  if (!requireField(v, "url", path)) return;
  if (!/^https:\/\//.test(v.url)) err(path + ".url", "must use https://");
  if (!requireField(v, "quality", path)) return;
  if (!ALLOWED_QUALITY.has(v.quality)) {
    err(path + ".quality", `not in ${[...ALLOWED_QUALITY].join("|")}`);
  }
  if (!requireField(v, "videoType", path)) return;
  if (!ALLOWED_VIDEO_TYPES.has(v.videoType)) {
    err(path + ".videoType", `not in ${[...ALLOWED_VIDEO_TYPES].join("|")}`);
  }
}

function checkContent(c, path) {
  if (!requireField(c, "dateAdded", path)) return;
  if (!ISO_DATETIME.test(c.dateAdded)) err(path + ".dateAdded", "not ISO 8601");
  if (!requireField(c, "duration", path)) return;
  if (!Number.isInteger(c.duration) || c.duration <= 0) {
    err(path + ".duration", "must be positive integer seconds");
  }
  if (!requireField(c, "language", path)) return;
  if (!requireField(c, "videos", path)) return;
  if (!Array.isArray(c.videos) || c.videos.length === 0) {
    err(path + ".videos", "must be a non-empty array");
    return;
  }
  c.videos.forEach((v, i) => checkVideo(v, `${path}.videos[${i}]`));
}

function checkShortFormVideo(item, path, seenIds) {
  if (!requireField(item, "id", path)) return;
  if (seenIds.has(item.id)) err(path + ".id", `duplicate id "${item.id}"`);
  seenIds.add(item.id);

  if (!requireField(item, "title", path)) return;

  if (!requireField(item, "shortDescription", path)) return;
  if (item.shortDescription.length > 200) {
    err(path + ".shortDescription", `> 200 chars (${item.shortDescription.length})`);
  }
  if (item.longDescription && item.longDescription.length > 500) {
    err(path + ".longDescription", `> 500 chars (${item.longDescription.length})`);
  }

  if (!requireField(item, "thumbnail", path)) return;
  if (!/^https:\/\//.test(item.thumbnail)) err(path + ".thumbnail", "must use https://");
  // Mux thumbnail URLs encode size as query params; we sanity-check that.
  const widthMatch = item.thumbnail.match(/[?&]width=(\d+)/);
  const heightMatch = item.thumbnail.match(/[?&]height=(\d+)/);
  if (widthMatch && heightMatch) {
    const w = +widthMatch[1];
    const h = +heightMatch[1];
    if (w < 800 || h < 450) warn(path + ".thumbnail", `< 800x450 (${w}x${h})`);
    const ratio = w / h;
    if (Math.abs(ratio - 16 / 9) > 0.02) warn(path + ".thumbnail", `not 16:9 (${w}x${h})`);
  } else {
    warn(path + ".thumbnail", "unable to confirm size from URL");
  }

  if (!requireField(item, "releaseDate", path)) return;
  if (!ISO_DATE.test(item.releaseDate)) err(path + ".releaseDate", "not YYYY-MM-DD");

  if (item.genres && Array.isArray(item.genres)) {
    item.genres.forEach((g, i) => {
      if (!KNOWN_GENRES.has(g)) warn(`${path}.genres[${i}]`, `unknown genre "${g}"`);
    });
  } else {
    warn(path + ".genres", "missing or not an array");
  }

  if (!requireField(item, "content", path)) return;
  checkContent(item.content, path + ".content");
}

function checkFeed(feed) {
  if (!requireField(feed, "providerName", "$")) return;
  if (!requireField(feed, "language", "$")) return;
  if (!requireField(feed, "lastUpdated", "$")) return;
  if (!ISO_DATETIME.test(feed.lastUpdated)) err("$.lastUpdated", "not ISO 8601");

  const hasAnyMedia =
    (Array.isArray(feed.shortFormVideos) && feed.shortFormVideos.length) ||
    (Array.isArray(feed.movies) && feed.movies.length) ||
    (Array.isArray(feed.series) && feed.series.length);
  if (!hasAnyMedia) {
    err("$", "feed has no shortFormVideos / movies / series");
    return;
  }

  const ids = new Set();
  if (Array.isArray(feed.shortFormVideos)) {
    feed.shortFormVideos.forEach((it, i) =>
      checkShortFormVideo(it, `$.shortFormVideos[${i}]`, ids)
    );
  }

  if (Array.isArray(feed.playlists)) {
    const playlistNames = new Set();
    feed.playlists.forEach((p, i) => {
      const path = `$.playlists[${i}]`;
      if (!requireField(p, "name", path)) return;
      if (playlistNames.has(p.name)) err(path + ".name", `duplicate "${p.name}"`);
      playlistNames.add(p.name);
      if (!Array.isArray(p.itemIds) || p.itemIds.length === 0) {
        err(path + ".itemIds", "must be a non-empty array");
        return;
      }
      p.itemIds.forEach((id, j) => {
        if (!ids.has(id)) err(`${path}.itemIds[${j}]`, `unknown item id "${id}"`);
      });
    });
    if (Array.isArray(feed.categories)) {
      feed.categories.forEach((c, i) => {
        const path = `$.categories[${i}]`;
        if (!requireField(c, "name", path)) return;
        if (!requireField(c, "playlistName", path)) return;
        if (!playlistNames.has(c.playlistName)) {
          err(path + ".playlistName", `no playlist named "${c.playlistName}"`);
        }
      });
    }
  }
}

async function main() {
  const raw = await readFile(FEED_PATH, "utf8");
  let feed;
  try {
    feed = JSON.parse(raw);
  } catch (e) {
    console.error(`feed.json is not valid JSON: ${e.message}`);
    process.exit(2);
  }
  checkFeed(feed);

  for (const w of warnings) console.warn(w);
  for (const e of errors) console.error(e);

  const count = Array.isArray(feed.shortFormVideos) ? feed.shortFormVideos.length : 0;
  if (errors.length) {
    console.error(`\nFAIL: ${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(1);
  }
  console.log(
    `OK: ${count} shortFormVideos, ${warnings.length} warning(s), 0 errors`
  );
}

main().catch((err) => {
  console.error("validate-feed failed:", err.message);
  process.exit(1);
});
