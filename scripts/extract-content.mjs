// Extract plain text from decrypted case study pages → assets/data/<slug>.json
//
// RUN AFTER unlocking the case studies:
//   node scripts/protect.mjs unlock <password>
//   node scripts/extract-content.mjs
//   node scripts/protect.mjs lock <password>
//
// The generated JSON files are committed to the repo and loaded by project-chat.js.
// They contain only text — no passwords, no secrets.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');

const SLUGS = ['multiproductexperience', 'machine-learning', 'aidincopilot', 'appbuilder'];

function stripHtml(html) {
  // Remove scripts, styles, and tags; collapse whitespace
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

mkdirSync(join(root, 'assets', 'data'), { recursive: true });

for (const slug of SLUGS) {
  const sourcePath = join(root, '_source', 'works', slug, 'index.html');
  let html;
  try {
    html = readFileSync(sourcePath, 'utf8');
  } catch {
    console.warn(`Skipping ${slug} — source file not found (run unlock first)`);
    continue;
  }

  const text = stripHtml(html);
  const outPath = join(root, 'assets', 'data', `${slug}.json`);
  writeFileSync(outPath, JSON.stringify({ slug, text }, null, 2));
  console.log(`✓ ${slug} → assets/data/${slug}.json (${text.length} chars)`);
}
