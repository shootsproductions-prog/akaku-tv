import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { MEETINGS } from '../data/meetings';
import { ISSUE_LABELS } from '../data/issues.ts';
import { CONTENT_BASE_URL, fetchRecaps, parseRecap } from '../data/remote.ts';
import type { IssueLabel, Meeting, PublishedRecap } from '../data/types';
import { groupIssues, IssueEntry, sortRecaps } from '../lib/recaps.ts';

const CACHE_KEY = 'akaku.countywatch.recaps.v2';

type ContentState = {
  /** Newest first. Demo meetings until real recaps are published and load. */
  meetings: Meeting[];
  /** Published recaps, newest first. Empty while the demo content shows. */
  recaps: PublishedRecap[];
  /** The four issue pages: every published meeting's entries for that issue. */
  issuesByLabel: Record<IssueLabel, IssueEntry[]>;
  recapFor: (meetingId: string) => PublishedRecap | undefined;
  /** 'demo' until real recaps are published and load successfully. */
  source: 'demo' | 'live';
};

const build = (recaps: PublishedRecap[]): ContentState => {
  const sorted = sortRecaps(recaps);
  return {
    meetings: sorted.length ? sorted.map(r => r.meeting) : MEETINGS,
    recaps: sorted,
    issuesByLabel: groupIssues(sorted, ISSUE_LABELS),
    recapFor: id => sorted.find(r => r.meeting.id === id || r.videoId === id),
    source: sorted.length ? 'live' : 'demo',
  };
};

const Ctx = createContext<ContentState>(build([]));

export function ContentProvider({ children }: { children: ReactNode }) {
  const [recaps, setRecaps] = useState<PublishedRecap[]>([]);

  useEffect(() => {
    if (!CONTENT_BASE_URL) return;
    let alive = true;
    const apply = (list: PublishedRecap[]) => {
      if (alive && list.length) setRecaps(list);
    };
    // Show the last good copy right away, then refresh from the network.
    AsyncStorage.getItem(CACHE_KEY)
      .then(raw => (raw ? apply((JSON.parse(raw) as unknown[]).map(parseRecap).filter((r): r is PublishedRecap => r !== null)) : undefined))
      .catch(() => undefined);
    fetchRecaps()
      .then(list => {
        apply(list);
        if (list.length) AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list)).catch(() => undefined);
      })
      .catch(() => undefined); // offline or unpublished: keep whatever is showing
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => build(recaps), [recaps]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useContent = () => useContext(Ctx);
