// The four issues Akakū tracks. People follow from this fixed list, and the
// recap pipeline labels every claim with exactly one of them (or "other",
// which never reaches the app). Keep in sync with ISSUE_LABELS in
// content/publish-meeting.mjs.
import type { IssueLabel } from './types.ts';

export const ISSUE_LABELS: IssueLabel[] = ['Water', 'Housing', 'Food Security', 'Disaster Recovery'];

export const ISSUE_BLURBS: Record<IssueLabel, string> = {
  Water: 'Supply, pipes and meters, rates, and rebuilding water systems',
  Housing: 'Permits, rentals, affordable housing and where people can live',
  'Food Security': 'Farms, food assistance and keeping Maui fed',
  'Disaster Recovery': 'Wildfire and storm recovery, FEMA and rebuilding',
};

export const isIssueLabel = (v: unknown): v is IssueLabel => typeof v === 'string' && (ISSUE_LABELS as string[]).includes(v);

export const DEFAULT_DISCLAIMER = 'Summarized by Akakū Intelligence. It can make mistakes.';
