import type { Meeting } from '../data/types.ts';

export type VoteSide = { label: 'Aye' | 'No'; n: number | null };

/**
 * The vote sides to show. A side whose count was never stated is `n: null`
 * (the screen says "not stated"); when neither was stated there is nothing to
 * tally and the screen explains that no count was given.
 */
export function voteSides(m: Pick<Meeting, 'ayes' | 'noes'>): VoteSide[] {
  if (m.ayes === null && m.noes === null) return [];
  return [
    { label: 'Aye', n: m.ayes },
    { label: 'No', n: m.noes },
  ];
}
