// Pure helpers for published recaps. No React Native imports, so they can be
// unit-tested with plain Node (see test/).
import type { Issue, IssueLabel, PublishedRecap } from '../data/types.ts';

export const isYoutubeId = (id: string) => /^[A-Za-z0-9_-]{11}$/.test(id);

/** `h:mm:ss` or `m:ss` to seconds. Unreadable input is 0. */
export function seekSeconds(t: string): number {
  const parts = t.split(':').map(Number);
  if (!parts.length || parts.length > 3 || parts.some(n => !Number.isFinite(n) || n < 0)) return 0;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

export const youtubeUrl = (id: string, seek = '0:00:00') => `https://youtu.be/${id}?t=${seekSeconds(seek)}`;

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Newest meeting first, by `meetingDateISO`. */
export function sortRecaps(recaps: PublishedRecap[]): PublishedRecap[] {
  return [...recaps].sort(
    (a, b) =>
      b.meetingDateISO.localeCompare(a.meetingDateISO) ||
      b.generatedAt.localeCompare(a.generatedAt) ||
      a.videoId.localeCompare(b.videoId),
  );
}

export type IssueEntry = { recap: PublishedRecap; issue: Issue };

/** The four issue pages: every published meeting's issues, grouped by label, newest meeting first. */
export function groupIssues(recaps: PublishedRecap[], labels: IssueLabel[]): Record<IssueLabel, IssueEntry[]> {
  const out = Object.fromEntries(labels.map(l => [l, [] as IssueEntry[]])) as Record<IssueLabel, IssueEntry[]>;
  for (const recap of sortRecaps(recaps)) {
    for (const issue of recap.issues) {
      if (issue.issue && out[issue.issue]) out[issue.issue].push({ recap, issue });
    }
  }
  return out;
}
