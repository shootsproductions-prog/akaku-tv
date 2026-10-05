// Castus live endpoints, one per Spectrum channel. This is the only file to
// edit to light up the Live tab and player: paste the same values that go in
// roku-channel/live-channels/{53,54,55}.json. Leave a value empty (or as a
// "TODO…" placeholder) and the app keeps showing the placeholder card.
//
// Find the .m3u8 in Castus admin's channel-stream settings, or open the
// castus_player_url from the JSON file in a browser and filter the Network
// tab for "m3u8".
type Feed = { hlsUrl: string; thumbnailUrl: string };

export const LIVE_FEEDS: Record<number, Feed> = {
  53: { hlsUrl: 'https://dlttx48mxf9m3.cloudfront.net/vod_clients/akaku/live/ch1/video.m3u8', thumbnailUrl: '' },
  54: { hlsUrl: 'https://dlttx48mxf9m3.cloudfront.net/vod_clients/akaku/live/ch2/video.m3u8', thumbnailUrl: '' },
  55: { hlsUrl: '', thumbnailUrl: '' },
};

/** Returns the URL only if it is a real https URL (not empty or a TODO). */
export function liveUrl(value: string | undefined): string | null {
  return value && /^https:\/\//i.test(value.trim()) ? value.trim() : null;
}

/** Cache-busts a frame-grab so each open of the Live tab shows a fresh frame. */
export function freshFrame(url: string | null, stamp: number): string | null {
  if (!url) return null;
  return `${url}${url.includes('?') ? '&' : '?'}t=${stamp}`;
}
