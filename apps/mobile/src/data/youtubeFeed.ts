// Akakū's own YouTube videos, read from YouTube's public feeds (no API key).
//
//   https://www.youtube.com/feeds/videos.xml?playlist_id=<id>   (newest 15 videos)
//
// Add a source by adding its playlist id below. A channel's uploads playlist is
// its channel id with the leading "UC" changed to "UU".
export const VIDEO_SOURCES: { label: string; playlistId: string }[] = [
  { label: 'County Watch', playlistId: 'PLpvzN8QDvdSaVs56bTYjL1a_pzSnIxbxR' },
];

export type VideoPost = { id: string; title: string; publishedISO: string; author: string; thumbnailUrl: string; durationSeconds?: number };

const decode = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1].trim()) : '';
};

/** Reads a YouTube Atom feed. Entries without a usable id or title are skipped. */
export function parseYoutubeFeed(xml: string): VideoPost[] {
  const out: VideoPost[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = tag(e, 'yt:videoId');
    const title = tag(e, 'title');
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !title) continue;
    out.push({
      id,
      title,
      publishedISO: tag(e, 'published'),
      author: tag(e.match(/<author>[\s\S]*?<\/author>/)?.[0] ?? '', 'name'),
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
  }
  return out;
}

export const timeAgo = (iso: string, now = Date.now()): string => {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const days = Math.floor((now - t) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export async function fetchVideos(sources = VIDEO_SOURCES): Promise<VideoPost[] | null> {
  const results = await Promise.all(
    sources.map(async s => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 8000);
      try {
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(s.playlistId)}`, { signal: ctl.signal });
        return res.ok ? parseYoutubeFeed(await res.text()) : null;
      } catch {
        return null;
      } finally {
        clearTimeout(t);
      }
    }),
  );
  if (results.every(r => r === null)) return null;
  const seen = new Set<string>();
  return results
    .flat()
    .filter((v): v is VideoPost => !!v && !seen.has(v.id) && !!seen.add(v.id))
    .sort((a, b) => b.publishedISO.localeCompare(a.publishedISO));
}

// The full channel feed, built by Pipeline from Akakū's YouTube channel (regular videos only, no Shorts):
//   <VIDEO_FEED_URL>  ->  { generatedAt, videos: [{ id, title, publishedISO, durationSeconds, isShort? }] }, newest first.
// Until it exists, the app falls back to the public playlist feeds above (newest 15 per playlist).
export const VIDEO_FEED_URL = 'https://raw.githubusercontent.com/shootsproductions-prog/akaku-tv/HEAD/content/videos/feed.json';

/** Keeps regular videos only: anything marked as a Short, or 60 seconds or shorter, is dropped. */
export function parseVideoFeed(raw: unknown, author = 'Akakū'): VideoPost[] {
  const list = (raw as { videos?: unknown } | null)?.videos;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: VideoPost[] = [];
  for (const item of list) {
    const v = item as Record<string, unknown> | null;
    const id = typeof v?.id === 'string' ? v.id : '';
    const title = typeof v?.title === 'string' ? v.title.trim() : '';
    const dur = typeof v?.durationSeconds === 'number' && Number.isFinite(v.durationSeconds) ? v.durationSeconds : undefined;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !title || seen.has(id)) continue;
    if (v?.isShort === true || (dur !== undefined && dur <= 60)) continue;
    seen.add(id);
    out.push({ id, title, publishedISO: typeof v?.publishedISO === 'string' ? v.publishedISO : '', author, thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, durationSeconds: dur });
  }
  return out.sort((a, b) => b.publishedISO.localeCompare(a.publishedISO));
}

export const durationLabel = (s: number): string => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};

/** The channel feed when it exists, otherwise the playlist feeds. Null only when both fail. */
export async function fetchAllVideos(): Promise<VideoPost[] | null> {
  if (VIDEO_FEED_URL) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const res = await fetch(VIDEO_FEED_URL, { signal: ctl.signal });
      if (res.ok) {
        const list = parseVideoFeed(await res.json());
        if (list.length) return list;
      }
    } catch {
      // fall through to the playlists
    } finally {
      clearTimeout(t);
    }
  }
  return fetchVideos();
}
