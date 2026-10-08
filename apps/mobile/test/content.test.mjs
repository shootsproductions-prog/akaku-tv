// Guards what real people see: every published issue must satisfy the contract.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildPublishedIssue } from '../../../content/publish-issue.mjs';
import { parseCatalogIssue, parseIndex } from '../src/data/catalog.ts';

const dir = new URL('../../../content/issues/', import.meta.url);
const read = name => JSON.parse(readFileSync(fileURLToPath(new URL(name, dir)), 'utf8'));
const index = read('index.json');

test('every published issue passes the publish checks and the app parser unchanged', () => {
  const parsed = parseIndex(index);
  assert.deepEqual(parsed.issues, index.issues, 'index lists only valid file names');
  for (const name of index.issues) {
    const file = read(name);
    assert.equal(`${file.slug}.json`, name, `${name}: file name matches slug`);
    assert.deepEqual(buildPublishedIssue(file), file, `${name}: already in published form`);
    const issue = parseCatalogIssue(file);
    assert.ok(issue, `${name}: app can read it`);
    assert.equal(issue.timeline.length, file.timeline.length, `${name}: no entry dropped by the parser`);
  }
});

test('default follows and merges point at published issues', () => {
  const slugs = index.issues.map(n => n.replace(/\.json$/, ''));
  for (const s of index.defaultFollows ?? []) assert.ok(slugs.includes(s), `default follow ${s} is published`);
  for (const to of Object.values(index.aliases ?? {})) assert.ok(slugs.includes(to), `merge target ${to} is published`);
  assert.equal(new Set(slugs).size, slugs.length, 'no duplicate issues');
});
