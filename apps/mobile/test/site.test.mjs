import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { page, render } from '../../../docs/site/build.mjs';

const doc = name => readFileSync(fileURLToPath(new URL(`../../../docs/site/${name}`, import.meta.url)), 'utf8');

test('renders headings, lists, bold, links and escapes HTML', () => {
  const html = render('# Title\n\nHello **world** <b>x</b> [a](https://x.org)\nline two\n\n- one\n- two\n\nMail {{CONTACT_EMAIL}}', { contactEmail: 'hi@akaku.org' });
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<strong>world<\/strong> &lt;b&gt;x&lt;\/b&gt; <a href="https:\/\/x.org">a<\/a><br>line two/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<a href="mailto:hi@akaku.org">hi@akaku.org<\/a>/);
});

test('refuses a missing or invalid contact email and any leftover placeholder', () => {
  assert.throws(() => render('x', { contactEmail: '' }), /contactEmail/);
  assert.throws(() => render('x', { contactEmail: 'not an email' }), /contactEmail/);
  assert.throws(() => render('{{OTHER}}', { contactEmail: 'a@b.org' }), /unfilled/);
});

test('the real pages build, are self-contained, and make no promises the app does not keep', () => {
  for (const f of ['privacy.md', 'support.md']) {
    const html = page('t', render(doc(f), { contactEmail: 'info@akaku.org' }));
    assert.ok(!/<script|<iframe|https?:\/\/[^"' ]*(analytics|tracker|facebook)/i.test(html), `${f}: no scripts or trackers`);
    assert.ok(!html.includes('{{'), `${f}: no placeholder left`);
  }
  const privacy = doc('privacy.md');
  assert.match(privacy, /does not ask you to create an account/);
  assert.match(privacy, /no advertising and no analytics/);
  // If any of these ever becomes true, the policy and the store forms must change first.
  const app = readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8');
  for (const lib of ['analytics', 'sentry', 'firebase', 'amplitude', 'mixpanel', 'expo-notifications', 'expo-location', 'expo-camera', 'expo-contacts']) {
    assert.ok(!app.includes(lib), `${lib} is in package.json: update docs/site/privacy.md and the store privacy forms first`);
  }
});
