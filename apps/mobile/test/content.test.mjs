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
const fixtureIssue = () => JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/example-issue.publish.json', import.meta.url)), 'utf8'));

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

test('the politics hold covers campaigning only; ballot business is public', () => {
  const base = fixtureIssue();
  const hold = text => assert.throws(() => buildPublishedIssue({ ...base, summary: text }), /campaign/, text);
  hold('Candidates for mayor will hold a campaign rally downtown.');
  hold('The group endorsed the candidates in the council race.');
  hold('She asked the crowd to vote for her.');
  hold('The council member is seeking re-election next year.');
  assert.throws(() => buildPublishedIssue({ ...base, timeline: [{ ...base.timeline[0], text: 'A mayoral forum covered housing.' }, ...base.timeline.slice(1)] }), /timeline\[0\]/);
  assert.doesNotThrow(() => buildPublishedIssue({ ...base, summary: 'Candidates for mayor will hold a campaign rally.' }, { allowElection: true }));
  // Government business about the ballot is published like any other.
  for (const ok of [
    'Charter amendments headed to the general election ballot.',
    'Voters will decide whether to dissolve the nomination board.',
    'The Clerk set polling places and deadlines for the election.',
    'The Council voted to place the question on the ballot.',
    'The board re-elected its chair and vice chair.',
    'The commission interviews three candidates for the director job.',
  ]) assert.doesNotThrow(() => buildPublishedIssue({ ...base, summary: ok }), ok);
});

test('passes through what Pipeline adds: endTs, reported entries, boards and bills', () => {
  const base = fixtureIssue();
  const src = base.timeline[0].source;
  const withSrc = source => buildPublishedIssue({ ...base, timeline: [{ ...base.timeline[0], source }, ...base.timeline.slice(1)] }).timeline[0].source;
  assert.equal(withSrc({ ...src, ts: '1:20:38', endTs: '1:21:12' }).endTs, '1:21:12');
  for (const bad of ['1:20:00', 'soon', '1:30:00']) assert.equal('endTs' in withSrc({ ...src, ts: '1:20:38', endTs: bad }), false, bad); // ignored, never rejected
  const reported = { dateISO: '2026-10-21', text: 'The County awarded the contract.', basis: 'reported', source: { type: 'county-release', url: 'https://www.mauicounty.gov/x', publisher: 'County of Maui', quote: 'The County awarded the contract.', retrievedISO: '2026-10-24' } };
  const out = buildPublishedIssue({ ...base, timeline: [reported, ...base.timeline] });
  assert.equal(out.timeline.find(e => e.basis === 'reported').source.publisher, 'County of Maui');
  assert.equal(parseCatalogIssue(out).timeline.some(e => e.basis === 'reported'), true);
  const withSearch = buildPublishedIssue({ ...base, boards: [{ name: 'Housing and Land Use Committee', group: 'council', short: ['HLU'] }, { name: '', group: 'x' }], bills: ['Bill 130 (2026)', ''] });
  assert.deepEqual(withSearch.boards, [{ name: 'Housing and Land Use Committee', group: 'council', short: ['HLU'] }]);
  assert.deepEqual(withSearch.bills, ['Bill 130 (2026)']);
  assert.equal('boards' in buildPublishedIssue(base), false);
});

test('upcomingEvent keeps only stable agenda and meeting links', () => {
  const base = fixtureIssue();
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
