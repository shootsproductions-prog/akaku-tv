import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { processIncoming } from '../../../content/process-incoming.mjs';

const fixture = name => JSON.parse(readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8'));

function dirs() {
  const root = mkdtempSync(join(tmpdir(), 'incoming-'));
  const d = { incomingDir: join(root, 'incoming'), issuesDir: join(root, 'issues'), rejectedDir: join(root, 'rejected'), meetingsDir: join(root, 'meetings') };
  mkdirSync(d.incomingDir);
  mkdirSync(join(d.incomingDir, 'meetings'));
  mkdirSync(d.issuesDir);
  mkdirSync(d.meetingsDir);
  writeFileSync(join(d.meetingsDir, 'index.json'), '{ "meetings": [] }\n');
  writeFileSync(join(d.issuesDir, 'index.json'), '{ "issues": [], "aliases": {}, "defaultFollows": ["keep-me"] }\n');
  const drop = (slug, obj) => writeFileSync(join(d.incomingDir, `${slug}.json`), JSON.stringify(obj));
  return { ...d, drop };
}
const ex = (over = {}) => ({ ...fixture('example-issue.publish.json'), ...over });

test('a good file is published, listed once, and leaves incoming', () => {
  const d = dirs();
  const base = ex();
  d.drop(base.slug, { ...base, internalNote: 'must not ship' });
  const r = processIncoming(d);
  assert.deepEqual(r.published, [base.slug]);
  assert.deepEqual(r.rejected, []);
  const out = JSON.parse(readFileSync(join(d.issuesDir, `${base.slug}.json`), 'utf8'));
  assert.ok(!('internalNote' in out));
  const idx = JSON.parse(readFileSync(join(d.issuesDir, 'index.json'), 'utf8'));
  assert.deepEqual(idx.issues, [`${base.slug}.json`]);
  assert.deepEqual(idx.defaultFollows, ['keep-me']);
  assert.ok(!existsSync(join(d.incomingDir, `${base.slug}.json`)));
  // Running again with the same file updates in place and does not list it twice.
  d.drop(base.slug, { ...base, title: 'A newer title' });
  processIncoming(d);
  const idx2 = JSON.parse(readFileSync(join(d.issuesDir, 'index.json'), 'utf8'));
  assert.deepEqual(idx2.issues, [`${base.slug}.json`]);
  assert.equal(JSON.parse(readFileSync(join(d.issuesDir, `${base.slug}.json`), 'utf8')).title, 'A newer title');
});

test('files that fail a check are rejected with a reason and publish nothing', () => {
  const d = dirs();
  const base = ex();
  d.drop('proposed-one', { ...base, slug: 'proposed-one', status: 'proposed' });
  d.drop('election-one', { ...base, slug: 'election-one', summary: 'Candidates for mayor will hold a campaign rally.' });
  d.drop('wrong-name', { ...base, slug: 'some-other-slug' });
  writeFileSync(join(d.incomingDir, 'broken.json'), '{ not json');
  const r = processIncoming(d);
  assert.deepEqual(r.published, []);
  assert.deepEqual(r.rejected.map(x => x.file).sort(), ['broken.json', 'election-one.json', 'proposed-one.json', 'wrong-name.json']);
  assert.match(readFileSync(join(d.rejectedDir, 'election-one.reason.txt'), 'utf8'), /hold/);
  assert.match(readFileSync(join(d.rejectedDir, 'proposed-one.reason.txt'), 'utf8'), /proposed/);
  assert.deepEqual(JSON.parse(readFileSync(join(d.issuesDir, 'index.json'), 'utf8')).issues, []);
  assert.deepEqual(readFileSync(join(d.issuesDir, 'index.json'), 'utf8').includes('election-one'), false);
});

test('one bad file does not stop the good ones, and a fixed file clears its old rejection', () => {
  const d = dirs();
  const base = ex();
  d.drop('bad', { ...base, slug: 'bad', status: 'proposed' });
  d.drop(base.slug, base);
  const r = processIncoming(d);
  assert.deepEqual(r.published, [base.slug]);
  assert.equal(r.rejected.length, 1);
  d.drop('bad', { ...base, slug: 'bad', title: 'Fixed' });
  const r2 = processIncoming(d);
  assert.deepEqual(r2.published, ['bad']);
  assert.ok(!existsSync(join(d.rejectedDir, 'bad.json')) && !existsSync(join(d.rejectedDir, 'bad.reason.txt')));
});

test('nothing incoming is fine', () => {
  const d = dirs();
  assert.deepEqual(processIncoming(d), { published: [], withdrawn: [], meetingsPublished: [], meetingsWithdrawn: [], indexChanged: false, rejected: [] });
});

test('withdrawing takes an issue down everywhere and clears what pointed at it', () => {
  const d = dirs();
  const base = ex();
  d.drop(base.slug, base);
  d.drop('other-issue', { ...base, slug: 'other-issue' });
  processIncoming(d);
  writeFileSync(join(d.issuesDir, 'index.json'), JSON.stringify({
    issues: [`${base.slug}.json`, 'other-issue.json'], aliases: { 'old-name': base.slug, [base.slug + '-x']: 'other-issue' }, defaultFollows: [base.slug, 'other-issue'],
  }));
  writeFileSync(join(d.incomingDir, `${base.slug}.withdraw`), '');
  const r = processIncoming(d);
  assert.deepEqual(r.withdrawn, [base.slug]);
  const idx = JSON.parse(readFileSync(join(d.issuesDir, 'index.json'), 'utf8'));
  assert.deepEqual(idx.issues, ['other-issue.json']);
  assert.deepEqual(idx.defaultFollows, ['other-issue']);
  assert.deepEqual(idx.aliases, { [base.slug + '-x']: 'other-issue' });
  assert.ok(!existsSync(join(d.issuesDir, `${base.slug}.json`)));
  assert.deepEqual(JSON.parse(readFileSync(join(d.issuesDir, 'catalog.json'), 'utf8')).issues.map(i => i.slug), ['other-issue']);
  assert.ok(!existsSync(join(d.incomingDir, `${base.slug}.withdraw`)));
  // Withdrawing something that is not published is rejected with a reason.
  writeFileSync(join(d.incomingDir, 'never-published.withdraw'), '');
  const r2 = processIncoming(d);
  assert.equal(r2.rejected.length, 1);
  assert.match(readFileSync(join(d.rejectedDir, 'never-published.reason.txt'), 'utf8'), /nothing to withdraw/);
});

const meeting = (over = {}) => ({ ...JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/H9lx2zorcDM.publish.json', import.meta.url)), 'utf8')), ...over });

test('meetings: published like issues, with real YouTube ids only, the election hold, and withdraw', () => {
  const d = dirs();
  const put = (name, obj) => writeFileSync(join(d.incomingDir, 'meetings', name), JSON.stringify(obj));
  put('H9lx2zorcDM.json', meeting());
  const bad = meeting();
  bad.meeting = { ...bad.meeting, id: 'cc-2024-05-01' };
  put('cc-2024-05-01.json', { ...bad, videoId: 'cc-2024-05-01' });
  const hot = meeting();
  hot.meeting = { ...hot.meeting, id: 'AAAAAAAAAAA', recap: `${hot.meeting.recap} The council member discussed her re-election campaign.` };
  put('AAAAAAAAAAA.json', { ...hot, videoId: 'AAAAAAAAAAA' });
  const r = processIncoming(d);
  assert.deepEqual(r.meetingsPublished, ['H9lx2zorcDM']);
  assert.deepEqual(r.rejected.map(x => x.file).sort(), ['meetings/AAAAAAAAAAA.json', 'meetings/cc-2024-05-01.json']);
  assert.match(readFileSync(join(d.rejectedDir, 'meetings', 'cc-2024-05-01.reason.txt'), 'utf8'), /YouTube/);
  assert.match(readFileSync(join(d.rejectedDir, 'meetings', 'AAAAAAAAAAA.reason.txt'), 'utf8'), /hold/);
  assert.deepEqual(JSON.parse(readFileSync(join(d.meetingsDir, 'index.json'), 'utf8')).meetings, ['H9lx2zorcDM.json']);
  assert.equal(JSON.parse(readFileSync(join(d.meetingsDir, 'H9lx2zorcDM.json'), 'utf8')).meeting.id, 'H9lx2zorcDM');
  writeFileSync(join(d.incomingDir, 'meetings', 'H9lx2zorcDM.withdraw'), '');
  const r2 = processIncoming(d);
  assert.deepEqual(r2.meetingsWithdrawn, ['H9lx2zorcDM']);
  assert.deepEqual(JSON.parse(readFileSync(join(d.meetingsDir, 'index.json'), 'utf8')).meetings, []);
  assert.ok(!existsSync(join(d.meetingsDir, 'H9lx2zorcDM.json')));
});

test('index-changes.json: merges and default follows are validated against what is published', () => {
  const d = dirs();
  const a = ex(), b = ex({ slug: 'second-issue', title: 'Second' });
  d.drop(a.slug, a);
  d.drop(b.slug, b);
  processIncoming(d);
  const idxPath = join(d.issuesDir, 'index.json');
  const change = obj => { writeFileSync(join(d.incomingDir, 'index-changes.json'), JSON.stringify(obj)); return processIncoming(d); };

  let r = change({ merge: { 'old-name': b.slug }, defaultFollows: [a.slug, b.slug] });
  assert.deepEqual(r.rejected, []);
  let idx = JSON.parse(readFileSync(idxPath, 'utf8'));
  assert.deepEqual(idx.aliases, { 'old-name': b.slug });
  assert.deepEqual(idx.defaultFollows, [a.slug, b.slug]);
  assert.ok(!existsSync(join(d.incomingDir, 'index-changes.json')));
  assert.ok(existsSync(join(d.issuesDir, 'catalog.json')));

  // Refused: unpublished target, a published address, a chain, too many follows, unknown fields. Index stays as it was.
  for (const bad of [
    { merge: { x: 'nope' } },
    { merge: { [a.slug]: b.slug } },
    { merge: { y: 'old-name' } },
    { defaultFollows: ['a', 'b', 'c', 'd', 'e', 'f'] },
    { defaultFollows: ['nope'] },
    { unmerge: ['never-merged'] },
    { delete: true },
  ]) {
    r = change(bad);
    assert.equal(r.rejected.length, 1, JSON.stringify(bad));
    assert.deepEqual(JSON.parse(readFileSync(idxPath, 'utf8')), idx, JSON.stringify(bad));
  }
  assert.match(readFileSync(join(d.rejectedDir, 'index-changes.reason.txt'), 'utf8'), /unknown field/);

  r = change({ unmerge: ['old-name'] });
  assert.deepEqual(r.rejected, []);
  assert.deepEqual(JSON.parse(readFileSync(idxPath, 'utf8')).aliases, {});
  assert.ok(!existsSync(join(d.rejectedDir, 'index-changes.reason.txt')));
});
