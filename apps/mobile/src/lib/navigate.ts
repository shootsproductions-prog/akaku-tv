import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import type { Target } from '../data/types';
import { BLUE } from '../theme';
import { isYoutubeId, youtubeUrl } from './recaps.ts';

export const openUrl = (href: string) => {
  WebBrowser.openBrowserAsync(href, { controlsColor: BLUE }).catch(() => {});
};

/** Open a meeting's YouTube video at `h:mm:ss` in the in-app browser. */
export const openVideo = (id: string, seek = '0:00:00') => openUrl(youtubeUrl(id, seek));

export const openMeeting = (id: string, seek = '0:00:00') =>
  router.push({ pathname: '/meeting/[id]', params: { id, seek } });

export const openIssue = (name: string) => router.push({ pathname: '/issue/[name]', params: { name } });

export const openExplainer = (id: string) => router.push({ pathname: '/explainer/[id]', params: { id } });

export const openPlayer = (num: number) => router.push({ pathname: '/player/[num]', params: { num: String(num) } });

/** Follow a citation to its proof: an explainer, a moment in a recording, or the source page. */
export function openTarget(t: Target) {
  if (t.ex) return openExplainer(t.ex);
  const mid = t.view?.id ?? t.mid;
  // A real recording: go straight to the proof in the video. Demo meetings open the recap screen.
  if (mid && t.seek && isYoutubeId(mid)) return openVideo(mid, t.seek);
  if (mid) return openMeeting(mid, t.seek);
  if (t.href) openUrl(t.href);
}
