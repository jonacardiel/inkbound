/**
 * Batch-generates art with Nano Banana through the Gemini API.
 *
 *   npx tsx scripts/generate-art.ts --tier 1              # all tier-1 assets
 *   npx tsx scripts/generate-art.ts --only races/dwarf,classes/wizard   # specific kind/id pairs
 *   npx tsx scripts/generate-art.ts --kind items --variants 3
 *   npx tsx scripts/generate-art.ts --only longsword --variants 1 --limit 1   # quick test
 *
 * - Reads GEMINI_API_KEY from .env (git-ignored; create it yourself).
 * - Attaches art/anchors/*.png to every call as style references.
 * - Writes art/raw/<id>-<n>.png and skips files that already exist, so it can
 *   be stopped and resumed at any time.
 * - Every call is independent (no chat history), which avoids style drift.
 */
import { GoogleGenAI } from '@google/genai';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { STYLE_REFERENCE_INSTRUCTION } from './art/templates';
import type { ArtEntry } from './build-prompts';

// Cards (3:4) are the big creator art: Nano Banana Pro at 2K.
// Icons (1:1) show at thumbnail size: Nano Banana 2 at 1K.
// Prices are approximate per-image estimates, used only for the spending cap.
const RENDER = {
  '3:4': { model: 'gemini-3-pro-image', size: '2K', price: 0.134 },
  '1:1': { model: 'gemini-3.1-flash-image', size: '1K', price: 0.067 },
} as const;

const ROOT = resolve(__dirname, '..');
const RAW_DIR = join(ROOT, 'art', 'raw');
const ANCHOR_DIR = join(ROOT, 'art', 'anchors');
// Running total of estimated spend across all runs (committed, so it survives restarts).
const LEDGER = join(ROOT, 'art', 'spend.json');

type Ledger = { estimatedUsd: number; images: number };
const readLedger = (): Ledger =>
  existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : { estimatedUsd: 0, images: 0 };

const { values } = parseArgs({
  options: {
    tier: { type: 'string' },
    kind: { type: 'string' },
    only: { type: 'string' },
    variants: { type: 'string', default: '2' },
    limit: { type: 'string' },
    budget: { type: 'string', default: '45' },
    concurrency: { type: 'string', default: '3' },
    'dry-run': { type: 'boolean', default: false },
  },
});

function loadAnchors() {
  if (!existsSync(ANCHOR_DIR)) return [];
  return readdirSync(ANCHOR_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .slice(0, 3) // Nano Banana 2 accepts up to 3 style references
    .map((f) => ({
      inlineData: {
        mimeType: f.endsWith('.png') ? 'image/png' : f.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
        data: readFileSync(join(ANCHOR_DIR, f)).toString('base64'),
      },
    }));
}

async function main() {
  const all = JSON.parse(readFileSync(join(ROOT, 'art', 'prompts.json'), 'utf8')) as ArtEntry[];
  const only = values.only?.split(',');
  const selected = all.filter(
    (e) =>
      (!values.tier || e.tier === Number(values.tier)) &&
      (!values.kind || e.kind === values.kind) &&
      (!only || only.includes(`${e.kind}/${e.id}`)),
  );
  const variants = Number(values.variants);
  const jobs = selected
    .flatMap((entry) =>
      Array.from({ length: variants }, (_, i) => ({
        entry,
        file: join(RAW_DIR, `${entry.kind}-${entry.id}-${i + 1}.png`),
      })),
    )
    .filter((j) => !existsSync(j.file))
    .slice(0, values.limit ? Number(values.limit) : undefined);

  const anchors = loadAnchors();
  const budget = Number(values.budget);
  const ledger = readLedger();
  const estimate = jobs.reduce((sum, j) => sum + RENDER[j.entry.aspect].price, 0);
  console.log(`${selected.length} assets, ${jobs.length} images to generate, ${anchors.length} style anchors`);
  console.log(
    `estimated cost $${estimate.toFixed(2)}; spent so far $${ledger.estimatedUsd.toFixed(2)} of $${budget} budget`,
  );
  if (anchors.length === 0) console.warn('warning: no anchors in art/anchors/; style will drift more between images');
  if (values['dry-run'] || jobs.length === 0) return;

  try {
    process.loadEnvFile(join(ROOT, '.env'));
  } catch {
    // Fall back to the environment.
  }
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set (add it to .env)');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  mkdirSync(RAW_DIR, { recursive: true });

  let done = 0;
  let stopped = false;
  const queue = [...jobs];
  const worker = async () => {
    while (!stopped && queue.length) {
      const { entry, file } = queue.shift()!;
      const render = RENDER[entry.aspect];
      if (ledger.estimatedUsd + render.price > budget) {
        console.error(`STOPPED: next image would exceed the ${budget} budget (raise it with --budget)`);
        stopped = true;
        break;
      }
      const prompt = anchors.length ? `${STYLE_REFERENCE_INSTRUCTION}\n\n${entry.prompt}` : entry.prompt;
      try {
        const response = await ai.models.generateContent({
          model: render.model,
          contents: [{ role: 'user', parts: [...anchors, { text: prompt }] }],
          config: {
            responseModalities: ['IMAGE'],
            imageConfig: { aspectRatio: entry.aspect, imageSize: render.size },
          },
        });
        const image = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        if (!image?.inlineData?.data)
          throw new Error(`no image returned (${response.candidates?.[0]?.finishReason ?? 'unknown'})`);
        writeFileSync(file, Buffer.from(image.inlineData.data, 'base64'));
        ledger.estimatedUsd += render.price;
        ledger.images++;
        writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n');
        done++;
        console.log(
          `[${done}/${jobs.length}] ${entry.kind}/${entry.id} (${render.model}, total ~$${ledger.estimatedUsd.toFixed(2)})`,
        );
      } catch (err) {
        const message = (err as Error).message;
        console.error(`FAILED ${entry.kind}/${entry.id}: ${message}`);
        // Billing and auth problems affect every request, so stop instead of retrying them all.
        if (/"code":(401|402|403)/.test(message)) {
          console.error('STOPPED: fix billing or the API key, then rerun (finished images are kept).');
          stopped = true;
          break;
        }
      }
    }
  };
  // A few requests in flight at once; the budget check runs before each one.
  await Promise.all(Array.from({ length: Number(values.concurrency) }, worker));
}

main();
