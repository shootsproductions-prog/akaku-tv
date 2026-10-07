import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { fetchCatalog, parseCatalogIssue, rankIssues, type Catalog, type CatalogIssue } from '../data/catalog.ts';
import { SAMPLE_CATALOG } from '../data/sampleCatalog.ts';
import { parseStore, startingFollows, toggleSlug, visibleFollows, type FollowStore } from '../lib/follows.ts';
import { useApp } from './AppState';

// Development only: EXPO_PUBLIC_SAMPLE_CATALOG=1 npx expo start  shows made-up issues, clearly labelled.
// A production build never has __DEV__ set, so sample issues can never reach real users.
const SAMPLE = __DEV__ && process.env.EXPO_PUBLIC_SAMPLE_CATALOG === '1';
const FOLLOWS_KEY = `akaku.follows.v1${SAMPLE ? '.sample' : ''}`;
const CACHE_KEY = 'akaku.catalog.v1';

type CatalogState = {
  /** Null until the first real issue is published: the app then keeps its four topics. */
  catalog: Catalog | null;
  sample: boolean;
  /** Followed issues that are still in the catalog, in catalog order. */
  followed: CatalogIssue[];
  isFollowing: (slug: string) => boolean;
  toggle: (slug: string) => void;
  bySlug: (slug: string) => CatalogIssue | undefined;
};

const Ctx = createContext<CatalogState>({ catalog: null, sample: false, followed: [], isFollowing: () => false, toggle: () => {}, bySlug: () => undefined });

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { openSheet } = useApp();
  const [catalog, setCatalog] = useState<Catalog | null>(SAMPLE ? SAMPLE_CATALOG : null);
  const [store, setStore] = useState<FollowStore | null>(null); // null until read from storage
  const welcomed = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(FOLLOWS_KEY)
      .then(raw => setStore(parseStore(raw)))
      .catch(() => setStore({ slugs: [], initialised: false }));
  }, []);

  useEffect(() => {
    if (SAMPLE) return;
    let alive = true;
    const apply = (c: Catalog | null) => alive && c && setCatalog(c);
    AsyncStorage.getItem(CACHE_KEY)
      .then(raw => {
        if (!raw) return;
        const c = JSON.parse(raw) as Catalog;
        const list = rankIssues((c.list ?? []).map(parseCatalogIssue).filter((i): i is CatalogIssue => !!i));
        if (list.length) apply({ ...c, list });
      })
      .catch(() => undefined);
    fetchCatalog()
      .then(c => {
        apply(c);
        if (c) AsyncStorage.setItem(CACHE_KEY, JSON.stringify(c)).catch(() => undefined);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // First time the catalog and the stored choices are both known: start on the defaults and say hello once.
  useEffect(() => {
    if (!catalog || !store) return;
    const next = startingFollows(store, catalog.defaultFollows, catalog.aliases);
    if (next.slugs.join() === store.slugs.join() && next.initialised === store.initialised) return;
    const firstRun = !store.initialised;
    setStore(next);
    AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify(next)).catch(() => undefined);
    if (firstRun && next.slugs.length && !welcomed.current) {
      welcomed.current = true;
      openSheet('welcome');
    }
  }, [catalog, store, openSheet]);

  const toggle = useCallback((slug: string) => {
    setStore(s => {
      const next = { initialised: true, slugs: toggleSlug(s?.slugs ?? [], slug) };
      AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo<CatalogState>(() => {
    const list = catalog?.list ?? [];
    const present = list.map(i => i.slug);
    const mine = visibleFollows(store?.slugs ?? [], present);
    return {
      catalog,
      sample: SAMPLE,
      followed: list.filter(i => mine.includes(i.slug)),
      isFollowing: slug => mine.includes(slug),
      toggle,
      bySlug: slug => list.find(i => i.slug === slug),
    };
  }, [catalog, store, toggle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCatalog = () => useContext(Ctx);
