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
  const d = { incomingDir: join(root, 'incoming'), issuesDir: join(root, 'issues'), rejectedDir: join(root, 'rejected') };
  mkdirSync(d.incomingDir);
  mkdirSync(d.issuesDir);
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
  d.drop('election-one', { ...base, slug: 'election-one', summary: 'Voters decide a ballot measure in November.' });
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
  assert.deepEqual(processIncoming(d), { published: [], rejected: [] });
});
