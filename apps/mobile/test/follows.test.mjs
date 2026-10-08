import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SAMPLE_CATALOG } from '../src/data/sampleCatalog.ts';
import { parseStore, resolveFollows, startingFollows, toggleSlug, visibleFollows } from '../src/lib/follows.ts';

test('first run starts on the catalog defaults, once', () => {
  const first = startingFollows({ slugs: [], initialised: false }, ['water-a', 'water-b'], {});
  assert.deepEqual(first, { initialised: true, slugs: ['water-a', 'water-b'] });
  // A person who unfollowed everything is not put back on the defaults.
  assert.deepEqual(startingFollows({ slugs: [], initialised: true }, ['water-a'], {}), { initialised: true, slugs: [] });
});

test('merged issues move followers and never duplicate', () => {
  assert.deepEqual(resolveFollows(['old', 'new', 'x'], { old: 'new' }), ['new', 'x']);
  assert.deepEqual(startingFollows({ slugs: ['old'], initialised: true }, [], { old: 'new' }).slugs, ['new']);
});

test('toggle and visibility', () => {
  assert.deepEqual(toggleSlug(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(toggleSlug(['a', 'b'], 'a'), ['b']);
  assert.deepEqual(visibleFollows(['a', 'gone', 'b'], ['a', 'b']), ['a', 'b']);
});

test('stored follows survive bad data', () => {
  assert.deepEqual(parseStore(null), { slugs: [], initialised: false });
  assert.deepEqual(parseStore('{not json'), { slugs: [], initialised: false });
  assert.deepEqual(parseStore('{"slugs":["a",3],"initialised":true}'), { slugs: ['a'], initialised: true });
});

test('the sample catalog is valid, clearly labelled, and ranks water first', () => {
  const { list, defaultFollows } = SAMPLE_CATALOG;
  assert.equal(list.length, 5);
  assert.ok(list.every(i => i.title.startsWith('Sample')));
  assert.equal(list[0].slug, 'sample-water-meters');
  assert.equal(list.at(-1).status, 'resolved');
  assert.ok(defaultFollows.every(s => list.some(i => i.slug === s)));
  assert.ok(list[0].timeline.some(e => e.basis === 'conflicting'));
});
