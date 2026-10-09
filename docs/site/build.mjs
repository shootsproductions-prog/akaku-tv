#!/usr/bin/env node
// Builds the app's privacy policy and support page as plain, fast HTML (no scripts, no trackers).
//
//   node docs/site/build.mjs        -> docs/site/dist/{privacy,support}.html (whole page) and .body.html (just the text)
//
// Set "contactEmail" in docs/site/config.json first: the build refuses to run with it empty,
// so a page can never go live with a blank placeholder. Host the two files anywhere
// (akaku.org pages, akaku.ai, or any static host) and put their addresses in
// apps/mobile/src/data/links.ts (PRIVACY_URL, SUPPORT_URL) and in the App Store and Google Play listings.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  let t = esc(s);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/(^|[\s(>])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})(?![^<]*<\/a>)/g, '$1<a href="mailto:$2">$2</a>');
  t = t.replace(/\bmauicounty\.gov\b(?![^<]*<\/a>)/g, '<a href="https://www.mauicounty.gov/">mauicounty.gov</a>');
  return t;
}

/** Converts the small Markdown subset these pages use: # ## headings, paragraphs, - lists, **bold**, [links](url). */
export function render(md, { contactEmail }) {
  if (!contactEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) throw new Error('set a valid "contactEmail" in docs/site/config.json first');
  const src = md.replaceAll('{{CONTACT_EMAIL}}', contactEmail);
  if (/\{\{[^}]*\}\}/.test(src)) throw new Error('the page still has an unfilled {{placeholder}}');
  const out = [];
  let list = null;
  let para = [];
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`);
    para = [];
  };
  const closeList = () => {
    if (list) out.push(`<ul>${list.join('')}</ul>`);
    list = null;
  };
  for (const raw of src.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); closeList(); continue; }
    const h = line.match(/^(#{1,2})\s+(.*)$/);
    if (h) { flush(); closeList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const li = line.match(/^-\s+(.*)$/);
    if (li) { flush(); (list ??= []).push(`<li>${inline(li[1])}</li>`); continue; }
    closeList();
    para.push(line);
  }
  flush();
  closeList();
  return out.join('\n');
}

export function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
:root { color-scheme: light dark; --bg: #ffffff; --ink: #12202b; --muted: #546573; --link: #0a6bbd; --line: #d9e1e7; }
@media (prefers-color-scheme: dark) { :root { --bg: #0f151b; --ink: #e7eef3; --muted: #9db0bf; --link: #5aa9ec; --line: #2a3945; } }
body { margin: 0; background: var(--bg); color: var(--ink); font: 18px/1.65 -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif; }
main { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
h1 { font-size: 1.9rem; line-height: 1.2; margin: 0 0 1.2rem; }
h2 { font-size: 1.25rem; margin: 2.2rem 0 .4rem; padding-top: 1.2rem; border-top: 1px solid var(--line); }
p, li { margin: .6rem 0; }
ul { padding-left: 1.3rem; }
a { color: var(--link); }
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

function main() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const cfg = JSON.parse(readFileSync(join(dir, 'config.json'), 'utf8'));
  mkdirSync(join(dir, 'dist'), { recursive: true });
  for (const [file, title] of [['privacy', 'Akakū app: privacy policy'], ['support', 'Akakū app: help and support']]) {
    let body;
    try {
      body = render(readFileSync(join(dir, `${file}.md`), 'utf8'), cfg);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
    writeFileSync(join(dir, 'dist', `${file}.html`), page(title, body));
    // Just the text, for pasting into a WordPress "Custom HTML" block so the site's own look applies.
    writeFileSync(join(dir, 'dist', `${file}.body.html`), body + '\n');
    console.log(`Built docs/site/dist/${file}.html and ${file}.body.html`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
