// Pure helpers for shaping records that flow into roku-channel/records/.
// Kept here so both the API route and the page can share the logic
// (e.g. previewing the derived record_id in the form).

export const CONTENT_TYPES = [
  "news",
  "cultural",
  "music",
  "community",
  "sports",
  "talk_show",
  "other",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

// Mirrors scripts/build-feed.mjs so the resulting feed.json is consistent
// regardless of whether build-feed regenerates from the same record.
export const CONTENT_TYPE_TO_GENRES: Record<ContentType, string[]> = {
  news: ["news"],
  cultural: ["special", "documentary"],
  music: ["music"],
  community: ["special"],
  sports: ["sports"],
  talk_show: ["talk"],
  other: ["special"],
};

// Hawaiian-aware slugify. The existing record_ids drop ʻokina + kahakō
// (e.g. "Hoʻolauleʻa O Hāna" → "hoolaulea-o-hana") so URLs and folder
// names stay ASCII-safe. The original title is preserved unchanged in
// the record's `title` field.
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[ʻʼ'`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function deriveRecordId(estimatedDate: string, title: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(estimatedDate)) {
    throw new Error(`estimated_date must be YYYY-MM-DD, got "${estimatedDate}"`);
  }
  const compact = estimatedDate.replace(/-/g, "");
  const slug = slugify(title);
  if (!slug) throw new Error("title slugifies to empty string");
  return `${compact}-${slug}`;
}

function clamp(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export type MuxAssetDetails = {
  playbackId: string;
  durationSeconds: number;
};

export type ProducerInput = {
  title: string;
  description: string;
  contentType: ContentType;
  tags: string[];
  hasOleloHawaii: boolean;
  estimatedDate: string;
  thumbnailTime?: number;
};

export type CatalogRecord = {
  record_id: string;
  mux_playback_id: string;
  start_time: number | null;
  end_time: number | null;
  title: string;
  description: string;
  content_type: ContentType;
  tags: string[];
  has_olelo_hawaii: boolean;
  thumbnail_time: number;
  estimated_date: string;
  duration_seconds: number;
  roku: {
    media_type: "shortFormVideo";
    short_description: string;
    long_description: string;
    release_date: string;
    genres: string[];
    thumbnail_url: string;
    playback: {
      url: string;
      videoType: "HLS";
      quality: "HD";
    };
    captions_in_manifest: true;
    clip_required: false;
  };
};

export function buildRecord(input: ProducerInput, mux: MuxAssetDetails): CatalogRecord {
  const recordId = deriveRecordId(input.estimatedDate, input.title);
  const thumbnailTime = input.thumbnailTime ?? Math.min(60, mux.durationSeconds / 2);

  return {
    record_id: recordId,
    mux_playback_id: mux.playbackId,
    start_time: null,
    end_time: null,
    title: input.title,
    description: input.description,
    content_type: input.contentType,
    tags: input.tags,
    has_olelo_hawaii: input.hasOleloHawaii,
    thumbnail_time: thumbnailTime,
    estimated_date: input.estimatedDate,
    duration_seconds: mux.durationSeconds,
    roku: {
      media_type: "shortFormVideo",
      short_description: clamp(input.description, 200),
      long_description: clamp(input.description, 500),
      release_date: input.estimatedDate,
      genres: CONTENT_TYPE_TO_GENRES[input.contentType],
      thumbnail_url: `https://image.mux.com/${mux.playbackId}/thumbnail.jpg?time=${thumbnailTime}&width=1280&height=720&fit_mode=smartcrop`,
      playback: {
        url: `https://stream.mux.com/${mux.playbackId}.m3u8`,
        videoType: "HLS",
        quality: "HD",
      },
      captions_in_manifest: true,
      clip_required: false,
    },
  };
}
