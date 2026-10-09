import AsyncStorage from '@react-native-async-storage/async-storage';
import { ISSUE_LABELS, isIssueLabel } from '../data/issues.ts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { FeedbackContext } from '../lib/feedback.ts';
import { KUPUNA_SCALE, THEMES, type Palette } from '../theme';

export type ThemePref = 'system' | 'light' | 'dark';
export type SheetName = 'cast' | 'report' | 'follow' | 'welcome' | 'feedback' | null;
export type FollowedIssue = { name: string; on: boolean; count: number };

type AppState = {
  // Display preferences (persisted)
  themePref: ThemePref;
  isDark: boolean;
  colors: Palette;
  toggleTheme: () => void;
  kupuna: boolean;
  scale: number;
  toggleKupuna: () => void;

  // AirPlay / Cast
  castDevice: string | null;
  setCastDevice: (name: string | null) => void;

  // Bottom sheets
  sheet: SheetName;
  /** Issue name the weekly-report sheet is showing. */
  reportIssue: string | null;
  openSheet: (name: Exclude<SheetName, null>, opts?: { issue?: string }) => void;
  /** What the "Report an error" sheet is about. */
  feedbackCtx: FeedbackContext | null;
  openFeedback: (ctx: FeedbackContext) => void;
  closeSheet: () => void;

  // County Watch personalisation
  issues: FollowedIssue[];
  toggleFollow: (name: string) => void;
  isFollowing: (name: string) => boolean;
  reminders: Record<string, boolean>;
  toggleReminder: (id: string) => void;

  // Videos
};

const Ctx = createContext<AppState | null>(null);
const PREFS_KEY = 'akaku.prefs.v1';

// People follow from a fixed list, so nobody can follow something unrelated to Maui.
const INITIAL_ISSUES: FollowedIssue[] = ISSUE_LABELS.map(name => ({ name, on: false, count: 0 }));

export function AppStateProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [themePref, setThemePref] = useState<ThemePref>('system');
  const [kupuna, setKupuna] = useState(false);
  const [castDevice, setCastDevice] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [reportIssue, setReportIssue] = useState<string | null>(null);
  const [feedbackCtx, setFeedbackCtx] = useState<FeedbackContext | null>(null);
  const [issues, setIssues] = useState(INITIAL_ISSUES);
  const [reminders, setReminders] = useState<Record<string, boolean>>({ c4: true });

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then(raw => {
        if (!raw) return;
        const p = JSON.parse(raw) as { themePref?: ThemePref; kupuna?: boolean };
        if (p.themePref) setThemePref(p.themePref);
        if (typeof p.kupuna === 'boolean') setKupuna(p.kupuna);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ themePref, kupuna })).catch(() => {});
  }, [themePref, kupuna]);

  const isDark = themePref === 'dark' || (themePref === 'system' && scheme === 'dark');

  const toggleFollow = useCallback((name: string) => {
    if (!isIssueLabel(name)) return; // only the four tracked issues can be followed
    setIssues(list =>
      list.some(x => x.name === name)
        ? list.map(x => (x.name === name ? { ...x, on: !x.on } : x))
        : [...list, { name, on: true, count: 0 }],
    );
  }, []);

  const value = useMemo<AppState>(
    () => ({
      themePref,
      isDark,
      colors: isDark ? THEMES.dark : THEMES.light,
      toggleTheme: () => setThemePref(isDark ? 'light' : 'dark'),
      kupuna,
      scale: kupuna ? KUPUNA_SCALE : 1,
      toggleKupuna: () => setKupuna(k => !k),
      castDevice,
      setCastDevice,
      sheet,
      reportIssue,
      openSheet: (name, opts) => {
        if (opts?.issue) setReportIssue(opts.issue);
        setSheet(name);
      },
      feedbackCtx,
      openFeedback: ctx => {
        setFeedbackCtx(ctx);
        setSheet('feedback');
      },
      closeSheet: () => setSheet(null),
      issues,
      toggleFollow,
      isFollowing: name => issues.some(x => x.name === name && x.on),
      reminders,
      toggleReminder: id => setReminders(r => ({ ...r, [id]: !r[id] })),
    }),
    [themePref, isDark, kupuna, castDevice, sheet, reportIssue, feedbackCtx, issues, toggleFollow, reminders],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppStateProvider>');
  return v;
}
