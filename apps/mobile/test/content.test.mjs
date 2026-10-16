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

test('the election hold: election wording is refused unless the producer lifts it', () => {
  const base = read(index.issues[0]);
  assert.throws(() => buildPublishedIssue({ ...base, summary: 'The council discusses the November election.' }), /hold/);
  assert.throws(() => buildPublishedIssue({ ...base, timeline: [{ ...base.timeline[0], text: 'Voters will decide a charter vote in November.' }, ...base.timeline.slice(1)] }), /hold/);
  assert.doesNotThrow(() => buildPublishedIssue({ ...base, summary: 'The council discusses the November election.' }, { allowElection: true }));
  // A hiring search for job candidates is not an election.
  assert.doesNotThrow(() => buildPublishedIssue({ ...base, summary: 'The commission interviews three candidates for the director job.' }));
});

test('upcomingEvent keeps only stable agenda and meeting links', () => {
  const base = read(index.issues[0]);
  const source = { type: 'county-page', url: 'https://example.gov/a.pdf', publisher: 'County of Maui (Legistar)', quote: 'Bill 116', retrievedISO: '2026-10-16' };
  const sig = ev => ({ ...base.signals, upcomingEvent: { dateISO: '2026-10-21', what: 'Committee: Bill 116', source, ...ev } });
  const ok = buildPublishedIssue({ ...base, signals: sig({ agendaUrl: 'https://example.gov/a.pdf', meetingUrl: 'https://example.gov/m', junk: 1 }) });
  assert.equal(ok.signals.upcomingEvent.agendaUrl, 'https://example.gov/a.pdf');
  assert.equal(ok.signals.upcomingEvent.meetingUrl, 'https://example.gov/m');
  assert.equal('junk' in ok.signals.upcomingEvent, false);
  assert.throws(() => buildPublishedIssue({ ...base, signals: sig({ agendaUrl: 'http://example.gov/a.pdf' }) }), /agendaUrl/);
  assert.throws(() => buildPublishedIssue({ ...base, signals: sig({ agendaUrl: 'https://x.gov/f?sig=abc' }) }), /agendaUrl/);
  assert.throws(() => buildPublishedIssue({ ...base, signals: sig({ what: 'x'.repeat(141) }) }), /140/);
});
