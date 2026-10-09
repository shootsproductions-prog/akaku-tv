import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildFormBody, buildMailto, feedbackConfigured, reportFields, sendReport } from '../src/lib/feedback.ts';

const ctx = { kind: 'entry', id: 'bill-1', label: 'The motion passed with five ayes.', where: 'mJyIAre9As4 at 0:35:25' };
const meta = { platform: 'ios', version: '1.0.0' };
const cfg = { endpoint: 'https://docs.google.com/forms/d/e/ABC/formResponse', fields: { about: 'entry.1', comment: 'entry.2', where: 'entry.3', app: 'entry.4' }, email: '' };

test('not configured until a form or an email is set', () => {
  assert.equal(feedbackConfigured({ endpoint: '', fields: { about: '', comment: '', where: '', app: '' }, email: '' }), false);
  assert.equal(feedbackConfigured(cfg), true);
  assert.equal(feedbackConfigured({ ...cfg, endpoint: '' }), false);
  assert.equal(feedbackConfigured({ endpoint: '', fields: cfg.fields, email: 'a@b.org' }), true);
});

test('fields are trimmed, flattened and capped', () => {
  const f = reportFields(ctx, '  line one\n\nline   two  ' + 'x'.repeat(2000), meta);
  assert.ok(f.comment.startsWith('line one line two x'));
  assert.equal(f.comment.length, 1000);
  assert.equal(f.about, 'entry: The motion passed with five ayes. [bill-1]');
  assert.equal(f.app, 'ios 1.0.0');
});

test('form body uses the form entry ids and encodes text', () => {
  const body = buildFormBody(ctx, 'wrong & late', meta, cfg);
  const p = new URLSearchParams(body);
  assert.equal(p.get('entry.2'), 'wrong & late');
  assert.equal(p.get('entry.3'), 'mJyIAre9As4 at 0:35:25');
  assert.match(buildMailto(ctx, '', meta, { ...cfg, email: 'x@y.org' }), /^mailto:x@y\.org\?subject=/);
});

test('sending: form posts, falls back to mail, or fails honestly', async () => {
  const real = globalThis.fetch;
  try {
    let seen;
    globalThis.fetch = async (url, init) => { seen = { url, init }; return { ok: true }; };
    assert.deepEqual(await sendReport(ctx, 'hi', meta, cfg), { result: 'sent' });
    assert.equal(seen.url, cfg.endpoint);
    assert.equal(seen.init.method, 'POST');
    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.deepEqual(await sendReport(ctx, 'hi', meta, cfg), { result: 'failed' });
    const m = await sendReport(ctx, 'hi', meta, { ...cfg, email: 'x@y.org' });
    assert.equal(m.result, 'mail');
    assert.deepEqual(await sendReport(ctx, 'hi', meta, { endpoint: '', fields: cfg.fields, email: '' }), { result: 'failed' });
  } finally {
    globalThis.fetch = real;
  }
});
