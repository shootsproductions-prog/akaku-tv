// Which catalog issues a person follows. Pure logic so it can be tested without the app.
import { resolveSlug } from '../data/catalog.ts';

export type FollowStore = { slugs: string[]; initialised: boolean };

/** Move followers of merged issues to the issue they merged into, and drop duplicates. */
export function resolveFollows(slugs: string[], aliases: Record<string, string>): string[] {
  return [...new Set(slugs.map(s => resolveSlug(s, aliases)))];
}

/** First run: start people on the catalog's default follows. After that, never touch their choices except to follow merges. */
export function startingFollows(store: FollowStore, defaults: string[], aliases: Record<string, string>): FollowStore {
  if (store.initialised) return { initialised: true, slugs: resolveFollows(store.slugs, aliases) };
  return { initialised: true, slugs: resolveFollows(defaults, aliases) };
}

export const toggleSlug = (slugs: string[], slug: string): string[] => (slugs.includes(slug) ? slugs.filter(s => s !== slug) : [...slugs, slug]);

/** Only issues still in the catalog are shown; a retired issue is kept quietly in case it comes back. */
export const visibleFollows = (slugs: string[], present: string[]): string[] => slugs.filter(s => present.includes(s));

export function parseStore(raw: string | null): FollowStore {
  try {
    const p = raw ? (JSON.parse(raw) as { slugs?: unknown; initialised?: unknown }) : null;
    const slugs = Array.isArray(p?.slugs) ? p.slugs.filter((s): s is string => typeof s === 'string') : [];
    return { slugs, initialised: p?.initialised === true };
  } catch {
    return { slugs: [], initialised: false };
  }
}
