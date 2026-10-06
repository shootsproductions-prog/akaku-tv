import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { MEETINGS } from '../data/meetings';
import { CONTENT_BASE_URL, fetchMeetings } from '../data/remote';
import type { Meeting } from '../data/types';

const CACHE_KEY = 'akaku.countywatch.meetings.v1';

type ContentState = {
  meetings: Meeting[];
  /** 'demo' until real recaps are published and load successfully. */
  source: 'demo' | 'live';
};

const Ctx = createContext<ContentState>({ meetings: MEETINGS, source: 'demo' });

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentState>({ meetings: MEETINGS, source: 'demo' });

  useEffect(() => {
    if (!CONTENT_BASE_URL) return;
    let alive = true;
    const apply = (meetings: Meeting[]) => {
      if (alive && meetings.length) setState({ meetings, source: 'live' });
    };
    // Show the last good copy right away, then refresh from the network.
    AsyncStorage.getItem(CACHE_KEY)
      .then(raw => (raw ? apply(JSON.parse(raw) as Meeting[]) : undefined))
      .catch(() => undefined);
    fetchMeetings()
      .then(meetings => {
        apply(meetings);
        if (meetings.length) AsyncStorage.setItem(CACHE_KEY, JSON.stringify(meetings)).catch(() => undefined);
      })
      .catch(() => undefined); // offline or unpublished: keep whatever is showing
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useContent = () => useContext(Ctx);
