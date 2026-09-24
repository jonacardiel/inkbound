/**
 * Builds art/review/index.html: a picker for choosing between generated
 * variants. Open it in any browser (double-click the file), click the version
 * you prefer for each asset, then "Save picks" downloads approved.json.
 * Put that file in art/ (or tell Claude your picks) and run
 * `npx tsx scripts/build-art-manifest.ts` to pack the chosen art.
 *
 *   npx tsx scripts/review-art.ts
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(__dirname, '..');
const RAW = join(ROOT, 'art', 'raw');
const OUT = join(ROOT, 'art', 'review');
const THUMBS = join(OUT, 'thumbs');

async function main() {
  mkdirSync(THUMBS, { recursive: true });
  const approvedFile = join(ROOT, 'art', 'approved.json');
  const approved: Record<string, number> = existsSync(approvedFile) ? JSON.parse(readFileSync(approvedFile, 'utf8')) : {};

  // File names are <kind>-<id>-<variant>.png; kinds contain no dashes.
  const groups = new Map<string, { variant: number; thumb: string }[]>();
  for (const file of readdirSync(RAW).filter((f) => f.endsWith('.png')).sort()) {
    const m = file.match(/^([a-z]+)-(.+)-(\d+)\.png$/);
    if (!m) continue;
    const thumb = file.replace(/\.png$/, '.webp');
    if (!existsSync(join(THUMBS, thumb))) {
      await sharp(join(RAW, file)).resize(360).webp({ quality: 78 }).toFile(join(THUMBS, thumb));
    }
    const key = `${m[1]}/${m[2]}`;
    groups.set(key, [...(groups.get(key) ?? []), { variant: Number(m[3]), thumb }]);
  }

  // Only assets with a real choice need review; singles are approved by default.
  const choices = [...groups].filter(([, v]) => v.length > 1);
  const data = choices.map(([key, variants]) => ({ key, variants, picked: approved[key] ?? variants[0].variant }));

  writeFileSync(
    join(OUT, 'index.html'),
    `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pick Your Art</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 16px 16px 96px; background: #16120F; color: #EDE3CF; font: 15px/1.4 system-ui, sans-serif; }
  h1 { font: 400 28px Georgia, serif; margin: 0 0 4px; }
  .intro { color: #A89A84; margin: 0 0 16px; max-width: 60ch; }
  section { margin: 20px 0; }
  h2 { font: 400 18px Georgia, serif; margin: 0 0 8px; border-bottom: 1px solid #4A3F33; padding-bottom: 4px; }
  .row { display: flex; gap: 12px; flex-wrap: wrap; }
  button.v { all: unset; cursor: pointer; border: 2px solid #4A3F33; border-radius: 8px; padding: 6px; background: #1F1914; }
  button.v:focus-visible { outline: 3px solid #C9A45C; outline-offset: 2px; }
  button.v.on { border-color: #C9A45C; box-shadow: 0 0 0 2px #C9A45C; }
  button.v img { display: block; width: 180px; border-radius: 4px; }
  button.v span { display: block; text-align: center; margin-top: 4px; color: #A89A84; }
  button.v.on span { color: #C9A45C; font-weight: 700; }
  .bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: 12px; align-items: center; padding: 12px 16px; background: #100D0B; border-top: 2px solid #C9A45C; }
  .bar button { font: 700 15px system-ui; padding: 10px 18px; border-radius: 6px; border: 0; background: #C9A45C; color: #16120F; cursor: pointer; }
  .bar .count { color: #A89A84; }
  @media (max-width: 480px) { button.v img { width: 42vw; } }
</style></head>
<body>
<h1>Pick your art</h1>
<p class="intro">For each card, click the version you like best (the first one is picked by default). When you're done, click <b>Save picks</b> and move the downloaded <code>approved.json</code> into the project's <code>art</code> folder, or just tell Claude which ones you changed.</p>
<div id="list"></div>
<div class="bar"><button id="save">Save picks</button><span class="count" id="count"></span></div>
<script>
const DATA = ${JSON.stringify(data)};
const EXISTING = ${JSON.stringify(approved)};
const picks = Object.fromEntries(DATA.map(d => [d.key, d.picked]));
const list = document.getElementById('list');
function render() {
  list.innerHTML = '';
  for (const d of DATA) {
    const s = document.createElement('section');
    s.innerHTML = '<h2>' + d.key.replace('/', ' · ') + '</h2>';
    const row = document.createElement('div');
    row.className = 'row';
    for (const v of d.variants) {
      const b = document.createElement('button');
      b.className = 'v' + (picks[d.key] === v.variant ? ' on' : '');
      b.setAttribute('aria-pressed', String(picks[d.key] === v.variant));
      b.innerHTML = '<img loading="lazy" alt="' + d.key + ' version ' + v.variant + '" src="thumbs/' + v.thumb + '"><span>Version ' + v.variant + '</span>';
      b.onclick = () => { picks[d.key] = v.variant; render(); };
      row.appendChild(b);
    }
    s.appendChild(row);
    list.appendChild(s);
  }
  const changed = DATA.filter(d => picks[d.key] !== d.variants[0].variant).length;
  document.getElementById('count').textContent = DATA.length + ' cards · ' + changed + ' changed from version 1';
}
document.getElementById('save').onclick = () => {
  const blob = new Blob([JSON.stringify({ ...EXISTING, ...picks }, null, 2) + '\\n'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'approved.json';
  a.click();
};
render();
</script>
</body></html>
`,
  );
  console.log(`art/review/index.html: ${data.length} cards to choose between (${groups.size - data.length} single-version assets auto-approved)`);
}

main();
