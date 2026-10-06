import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../../../content/publish-meeting.mjs', import.meta.url));
const fixture = name => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));

function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'cw-publish-'));
  writeFileSync(join(dir, 'index.json'), '{ "meetings": [] }\n');
  const run = (...args) => spawnSync('node', [script, ...args], { env: { ...process.env, CONTENT_DIR: dir }, encoding: 'utf8' });
  return { dir, run };
}

const INTERNAL = ['review_flags', 'verification', 'claims', 'run', 'summarySource'];

test('publishing a full draft strips every internal field and marks it reviewed', () => {
  const { dir, run } = sandbox();
  const r = run(fixture('H9lx2zorcDM.draft.json'), '--reviewed');
  assert.equal(r.status, 0, r.stderr);
  const out = readJson(join(dir, 'H9lx2zorcDM.json'));
  for (const k of INTERNAL) assert.ok(!(k in out), `${k} must not ship`);
  assert.deepEqual(Object.keys(out.source), ['youtubeUrl']);
  assert.equal(out.status, 'reviewed');
  assert.equal(out.meeting.ayes, 5);
  assert.equal(out.meeting.noes, null);
  assert.deepEqual(readJson(join(dir, 'index.json')).meetings, ['H9lx2zorcDM.json']);
  assert.ok(!readFileSync(join(dir, 'H9lx2zorcDM.json'), 'utf8').includes('raw caption text that must not ship'));
});

test('a draft is refused without --reviewed', () => {
  const { dir, run } = sandbox();
  const r = run(fixture('H9lx2zorcDM.draft.json'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--reviewed/);
  assert.deepEqual(readJson(join(dir, 'index.json')).meetings, []);
});

test('an auto-publish file publishes as it is, keeping only the app-facing fields', () => {
  const { dir, run } = sandbox();
  const r = run(fixture('H9lx2zorcDM.publish.json'));
  assert.equal(r.status, 0, r.stderr);
  const out = readJson(join(dir, 'H9lx2zorcDM.json'));
  assert.match(out.status, /^auto-published/);
  assert.deepEqual(out.source, { youtubeUrl: 'https://youtu.be/H9lx2zorcDM' });
  assert.deepEqual(out.issues, []);
  assert.equal(out.meetingDateISO, '2026-09-28');
  assert.deepEqual(Object.keys(out).sort(), ['disclaimer', 'generatedAt', 'headline', 'issues', 'meeting', 'meetingDateISO', 'source', 'status', 'topics', 'videoId']);
});

test('a file whose issues contain "other" is rejected', () => {
  const { dir, run } = sandbox();
  const file = readJson(fixture('pW7rT2xY5bM.publish.json'));
  file.issues[0].issue = 'other';
  const p = join(dir, 'bad.json');
  writeFileSync(p, JSON.stringify(file));
  const r = run(p);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /other/);
});

test('a file with no disclaimer is rejected', () => {
  const { dir, run } = sandbox();
  const file = readJson(fixture('H9lx2zorcDM.publish.json'));
  delete file.disclaimer;
  const p = join(dir, 'bad.json');
  writeFileSync(p, JSON.stringify(file));
  const r = run(p);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /disclaimer/);
});

test('the existing checks still apply, and --remove unpublishes', () => {
  const { dir, run } = sandbox();
  const file = readJson(fixture('H9lx2zorcDM.publish.json'));
  file.meeting.recap = '';
  const p = join(dir, 'bad.json');
  writeFileSync(p, JSON.stringify(file));
  assert.equal(run(p).status, 1);
  assert.equal(run(fixture('H9lx2zorcDM.publish.json')).status, 0);
  assert.equal(run('--remove', 'H9lx2zorcDM').status, 0);
  assert.deepEqual(readJson(join(dir, 'index.json')).meetings, []);
  assert.equal(run('--remove', 'H9lx2zorcDM').status, 1);
});
