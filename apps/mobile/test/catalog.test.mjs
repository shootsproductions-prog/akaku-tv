import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { isHeatingUp, isStale, parseCatalogIssue, parseIndex, rankIssues, resolveSlug, whyRanked } from '../src/data/catalog.ts';

const script = fileURLToPath(new URL('../../../content/publish-issue.mjs', import.meta.url));
const fixture = name => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const EX = () => readJson(fixture('example-issue.publish.json'));

function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'issues-publish-'));
  writeFileSync(join(dir, 'index.json'), '{ "issues": [], "aliases": {}, "defaultFollows": [] }\n');
  const run = (...args) => spawnSync('node', [script, ...args], { env: { ...process.env, CONTENT_DIR: dir }, encoding: 'utf8' });
  const put = (name, obj) => {
    const p = join(dir, name);
    writeFileSync(p, JSON.stringify(obj));
    return p;
  };
  return { dir, run, put };
}

test('publishing keeps only app fields, adds sourceTypes and lists the file', () => {
  const { dir, run } = sandbox();
  const r = run(fixture('example-issue.publish.json'));
  assert.equal(r.status, 0, r.stderr);
  const out = readJson(join(dir, 'example-issue.json'));
  assert.ok(!('internalNotes' in out));
  assert.deepEqual(out.sourceTypes, ['meeting', 'county-page']);
  assert.deepEqual(readJson(join(dir, 'index.json')).issues, ['example-issue.json']);
});

test('a proposed issue never publishes', () => {
  const { dir, run, put } = sandbox();
  const r = run(put('p.json', { ...EX(), status: 'proposed' }));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /never leave Pipeline/);
  assert.deepEqual(readJson(join(dir, 'index.json')).issues, []);
});

test('missing disclaimer, bad slug, or a source without proof is refused', () => {
  const { run, put } = sandbox();
  assert.match(run(put('a.json', { ...EX(), disclaimer: '' })).stderr, /disclaimer/);
  assert.match(run(put('b.json', { ...EX(), slug: 'Bad Slug' })).stderr, /slug/);
  const noQuote = EX();
  delete noQuote.timeline[1].source.quote;
  assert.match(run(put('c.json', noQuote)).stderr, /quote/);
  const noTs = EX();
  noTs.timeline[0].source.ts = 'soon';
  assert.match(run(put('d.json', noTs)).stderr, /timestamp/);
  const http = EX();
  http.timeline[1].source.url = 'http://insecure.example';
  assert.match(run(put('e.json', http)).stderr, /https/);
});

test('a conflict needs both sides', () => {
  const { run, put } = sandbox();
  const one = EX();
  one.timeline[0].basis = 'conflicting';
  one.timeline[0].conflictGroup = 'g1';
  assert.match(run(put('one.json', one)).stderr, /needs both sides/);
  const both = EX();
  both.timeline.forEach(e => Object.assign(e, { basis: 'conflicting', conflictGroup: 'g1' }));
  assert.equal(run(put('both.json', both)).status, 0);
});

test('alias moves followers; default follow must exist; remove clears it', () => {
  const { dir, run, put } = sandbox();
  run(put('a.json', { ...EX(), slug: 'old-one' }));
  run(put('b.json', { ...EX(), slug: 'new-one' }));
  assert.equal(run('--default-follow', 'ghost').status, 1);
  assert.equal(run('--default-follow', 'new-one').status, 0);
  assert.equal(run('--alias', 'old-one=new-one').status, 0);
  const idx = readJson(join(dir, 'index.json'));
  assert.deepEqual(idx.issues, ['new-one.json']);
  assert.deepEqual(idx.aliases, { 'old-one': 'new-one' });
  assert.deepEqual(idx.defaultFollows, ['new-one']);
  assert.equal(run('--remove', 'new-one').status, 0);
  assert.deepEqual(readJson(join(dir, 'index.json')).defaultFollows, []);
});

test('the app parser accepts the published shape and drops what it cannot trust', () => {
  const i = parseCatalogIssue(EX());
  assert.equal(i.slug, 'example-issue');
  assert.deepEqual(i.timeline.map(e => e.dateISO), ['2026-10-06', '2026-09-28']);
  assert.equal(parseCatalogIssue({ ...EX(), status: 'proposed' }), null);
  assert.equal(parseCatalogIssue({ ...EX(), signals: { meetingsLast30d: -1 } }), null);
  const bad = EX();
  bad.timeline.push({ dateISO: '2026-10-07', text: 'no source', basis: 'confirmed' });
  assert.equal(parseCatalogIssue(bad).timeline.length, 2);
});

test('index parsing and alias resolution survive bad data and loops', () => {
  const idx = parseIndex({ issues: ['a.json', '../x.json', 5], aliases: { a: 'b', 'Bad Slug': 'c' }, defaultFollows: ['a', 'Nope!'] });
  assert.deepEqual(idx, { issues: ['a.json'], aliases: { a: 'b' }, defaultFollows: ['a'] });
  assert.equal(resolveSlug('a', { a: 'b', b: 'c' }), 'c');
  assert.equal(resolveSlug('a', { a: 'b', b: 'a' }), 'a');
  assert.equal(resolveSlug('z', {}), 'z');
});

test('heating up and ranking follow the raw counts', () => {
  const sig = (a, b) => ({ meetingsLast30d: a, meetingsLast90d: b, mentionsLast30d: 0, upcomingEvent: null });
  assert.equal(isHeatingUp(sig(4, 6)), true);
  assert.equal(isHeatingUp(sig(1, 1)), false);
  assert.equal(isHeatingUp(sig(2, 9)), false);
  const mk = (slug, o) => ({ ...parseCatalogIssue(EX()), slug, ...o });
  const ranked = rankIssues([
    mk('c', { signals: sig(1, 1) }),
    mk('done', { status: 'resolved', pinned: true, signals: sig(9, 9) }),
    mk('b', { signals: sig(3, 3) }),
    mk('pin', { pinned: true, signals: sig(0, 0) }),
  ]).map(i => i.slug);
  assert.deepEqual(ranked, ['pin', 'b', 'c', 'done']);
  assert.equal(whyRanked(mk('x', { signals: sig(4, 6) })), 'Discussed in 4 meetings this month');
  assert.equal(whyRanked(mk('x', { signals: sig(0, 2) })), 'Not discussed in a meeting this month');
});

test('an entry may name the board it came from', () => {
  const { dir, run, put } = sandbox();
  const withBody = EX();
  withBody.timeline[0].body = 'Board of Water Supply';
  withBody.timeline[1].body = '   ';
  assert.equal(run(put('b.json', withBody)).status, 0);
  const out = readJson(join(dir, 'example-issue.json'));
  assert.equal(out.timeline[0].body, 'Board of Water Supply');
  assert.ok(!('body' in out.timeline[1]));
  assert.equal(parseCatalogIssue(out).timeline.find(e => e.dateISO === '2026-09-28').body, 'Board of Water Supply');
});

test('speaker and as-of date are optional, validated, and have sensible fallbacks', () => {
  const { dir, run, put } = sandbox();
  const f = EX();
  f.asOfISO = '2026-10-08T09:00:00Z';
  f.timeline[0].speaker = '  Board chair ';
  assert.equal(run(put('s.json', f)).status, 0);
  const out = readJson(join(dir, 'example-issue.json'));
  assert.equal(out.asOfISO, '2026-10-08');
  assert.equal(out.timeline[0].speaker, 'Board chair');
  assert.equal(parseCatalogIssue(out).asOfISO, '2026-10-08');
  assert.match(run(put('bad.json', { ...EX(), asOfISO: 'yesterday' })).stderr, /asOfISO/);
  // No asOfISO: newest source retrieval, then lastSeenISO.
  assert.equal(parseCatalogIssue(EX()).asOfISO, '2026-10-06');
  assert.equal(parseCatalogIssue({ ...EX(), timeline: [] }).asOfISO, '2026-10-06');
});

test('a page is stale after two weeks without a refresh', () => {
  const i = parseCatalogIssue({ ...EX(), asOfISO: '2026-10-01' });
  assert.equal(isStale(i, Date.parse('2026-10-10T00:00:00Z')), false);
  assert.equal(isStale(i, Date.parse('2026-10-20T00:00:00Z')), true);
});
