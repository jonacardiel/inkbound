/**
 * Builds art/review.html: a contact sheet of every generated variant in art/raw/,
 * grouped by asset, shown at card size and at 64 px icon size.
 * Record winners in art/approved.json as { "races/dwarf": 2, ... }.
 *
 *   npx tsx scripts/review-art.ts
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const RAW = join(ROOT, 'art', 'raw');
const approvedFile = join(ROOT, 'art', 'approved.json');
const approved: Record<string, number> = existsSync(approvedFile) ? JSON.parse(readFileSync(approvedFile, 'utf8')) : {};

// File names are <kind>-<id>-<variant>.png; kinds contain no dashes.
const groups = new Map<string, { variant: number; file: string }[]>();
for (const file of readdirSync(RAW).filter((f) => f.endsWith('.png')).sort()) {
  const m = file.match(/^([a-z]+)-(.+)-(\d+)\.png$/);
  if (!m) continue;
  const key = `${m[1]}/${m[2]}`;
  groups.set(key, [...(groups.get(key) ?? []), { variant: Number(m[3]), file }]);
}

const sections = [...groups]
  .map(([key, variants]) => {
    const cards = variants
      .map(
        ({ variant, file }) => `
      <figure class="${approved[key] === variant ? 'approved' : ''}">
        <img class="big" src="raw/${file}" loading="lazy" alt="${key} variant ${variant}">
        <div class="row"><img class="icon" src="raw/${file}" alt=""><figcaption>#${variant}${approved[key] === variant ? ' ✓ approved' : ''}</figcaption></div>
      </figure>`,
      )
      .join('');
    return `<section><h2>${key}</h2><div class="grid">${cards}</div></section>`;
  })
  .join('\n');

writeFileSync(
  join(ROOT, 'art', 'review.html'),
  `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Art Review</title>
<style>
  body { margin: 0; padding: 16px; background: #16120F; color: #EDE3CF; font: 15px system-ui, sans-serif; }
  h1 { font-family: Georgia, serif; font-weight: normal; }
  h2 { font-family: Georgia, serif; font-weight: normal; border-bottom: 1px solid #4A3F33; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
  figure { margin: 0; padding: 8px; border: 1px solid #4A3F33; border-radius: 6px; }
  figure.approved { border-color: #C9A45C; box-shadow: 0 0 0 2px #C9A45C; }
  .big { width: 100%; display: block; border-radius: 3px; }
  .row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .icon { width: 64px; height: 64px; object-fit: cover; border-radius: 3px; }
</style></head>
<body><h1>Art review</h1><p>${groups.size} assets. The 64 px thumbnail shows how each reads as an icon.</p>
${sections}
</body></html>
`,
);
console.log(`art/review.html: ${groups.size} assets`);
