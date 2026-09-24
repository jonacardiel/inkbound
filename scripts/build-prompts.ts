/**
 * Builds art/prompts.json (one entry per asset) from the SRD content and the
 * app-authored meta, using the templates in scripts/art/templates.ts.
 *
 *   npx tsx scripts/build-prompts.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { content } from '../src/content';
import { classMeta } from '../src/content/meta/classes';
import { raceMeta, schoolMeta } from '../src/content/meta/races';
import { EXTRA_BACKGROUNDS } from '../src/content/extraBackgrounds';
import { figurePrompt, itemPrompt, schoolPrompt } from './art/templates';

export type ArtEntry = {
  id: string; // also the output filename
  kind: 'races' | 'classes' | 'schools' | 'backgrounds' | 'items' | 'portraits' | 'subclasses' | 'sigils' | 'ancestries';
  tier: 1 | 2 | 3;
  aspect: '3:4' | '1:1';
  prompt: string;
};

const entries: ArtEntry[] = [];
const add = (e: ArtEntry) => entries.push(e);

// --- Tier 1: everything the character creator shows first ---------------------------------
for (const race of content.races.all) {
  const m = raceMeta[race.index];
  add({ id: race.index, kind: 'races', tier: 1, aspect: '3:4', prompt: figurePrompt(m.artSubject, m.spot) });
}
for (const cls of content.classes.all) {
  const m = classMeta[cls.index];
  add({ id: cls.index, kind: 'classes', tier: 1, aspect: '3:4', prompt: figurePrompt(m.artSubject, m.spot) });
}
for (const school of content.magicSchools.all) {
  const m = schoolMeta[school.index];
  add({ id: school.index, kind: 'schools', tier: 1, aspect: '3:4', prompt: schoolPrompt(school.name, m.motif, m.colorName) });
}
add({
  id: 'acolyte',
  kind: 'backgrounds',
  tier: 1,
  aspect: '3:4',
  prompt: figurePrompt(
    'A young acolyte kneeling in a vast cathedral, tending a row of candles beneath towering stained-glass windows',
    { colorName: 'candle gold', element: 'the candle flames' },
    { heroic: false },
  ),
});
add({
  id: 'custom',
  kind: 'backgrounds',
  tier: 1,
  aspect: '3:4',
  prompt: figurePrompt(
    'A lone traveler seen from behind at the start of a winding road that leads toward distant mountains, an unwritten journal in hand',
    { colorName: 'dawn amber', element: 'the rising sun on the horizon' },
    { heroic: false },
  ),
});

for (const bg of EXTRA_BACKGROUNDS) {
  add({
    id: bg.index,
    kind: 'backgrounds',
    tier: 1,
    aspect: '3:4',
    prompt: figurePrompt(bg.artSubject, { colorName: 'warm amber', element: 'the brightest light in the scene' }, { heroic: false }),
  });
}

const isStartingGear = (e: (typeof content.equipment.all)[number]) =>
  e.equipmentCategory === 'weapon' || e.equipmentCategory === 'armor' || e.gearCategory === 'equipment-packs';

for (const item of content.equipment.all.filter(isStartingGear)) {
  const subject =
    item.gearCategory === 'equipment-packs'
      ? `adventurer's backpack (the ${item.name}) with its gear strapped on and spilling out`
      : item.name.toLowerCase();
  add({ id: item.index, kind: 'items', tier: 1, aspect: '1:1', prompt: itemPrompt(subject) });
}

// Style bake-off subject (the Dwarf, Wizard and Longsword are tier-1 entries above).
add({
  id: 'potion-of-healing',
  kind: 'items',
  tier: 1,
  aspect: '1:1',
  prompt: itemPrompt('glass healing potion bottle with a cork stopper', { colorName: 'crimson', element: 'the liquid inside the bottle' }),
});

// --- Tier 2: portraits, subclasses, sigils, dragon ancestries --------------------------------
const PORTRAIT_VARIANTS = [
  'a young woman with a determined expression',
  'a weathered older man with a knowing look',
  'a battle-scarred veteran with a fierce stare',
  'a thoughtful scholar with a calm, wry smile',
];
for (const race of content.races.all) {
  PORTRAIT_VARIANTS.forEach((variant, i) => {
    add({
      id: `${race.index}-${i + 1}`,
      kind: 'portraits',
      tier: 2,
      aspect: '3:4',
      prompt: figurePrompt(
        `A head-and-shoulders portrait of a ${race.name.toLowerCase()}, ${variant}, facing three-quarters toward the viewer`,
        undefined,
        { heroic: false },
      ),
    });
  });
}
for (const sub of content.subclasses.all) {
  const cls = classMeta[sub.class];
  add({
    id: sub.index,
    kind: 'subclasses',
    tier: 2,
    aspect: '3:4',
    prompt: figurePrompt(
      `A ${content.classes.get(sub.class).name.toLowerCase()} who follows the ${sub.subclassFlavor} of the ${sub.name}, shown in a moment that embodies it`,
      cls.spot,
    ),
  });
}
for (const cls of content.classes.all) {
  add({
    id: cls.index,
    kind: 'sigils',
    tier: 2,
    aspect: '1:1',
    prompt: itemPrompt(
      `heraldic emblem for the ${cls.name} class, a bold simple symbol inside a round engraved seal`,
      { colorName: classMeta[cls.index].spot.colorName, element: 'the central symbol' },
    ),
  });
}
for (const trait of content.traits.all.filter((t) => t.parent === 'draconic-ancestry')) {
  const color = trait.name.replace(/.*\(|\).*/g, '').trim() || trait.name;
  add({
    id: trait.index,
    kind: 'ancestries',
    tier: 2,
    aspect: '1:1',
    prompt: itemPrompt(`${color.toLowerCase()} dragon's head rearing with open jaws`, {
      colorName: `${color.toLowerCase()} dragon color`,
      element: 'the breath pouring from the jaws',
    }),
  });
}

// App icon: must read at launcher size and survive Android's circular mask, so the
// subject sits in the middle 60% with plain paper around it.
add({
  id: 'app-icon',
  kind: 'sigils',
  tier: 2,
  aspect: '1:1',
  prompt: itemPrompt(
    'twenty-sided die resting on an open leather-bound tome with a quill pen beside it, the whole group small and centered with wide empty margins of plain paper on every side, bold simple shapes that read clearly at tiny sizes',
    { colorName: 'warm gold', element: 'the edges of the die' },
  ),
});

// --- Tier 3: remaining gear and magic-item category art ---------------------------------------
for (const item of content.equipment.all.filter((e) => !isStartingGear(e) && e.equipmentCategory !== 'mounts-and-vehicles')) {
  add({ id: item.index, kind: 'items', tier: 3, aspect: '1:1', prompt: itemPrompt(item.name.toLowerCase()) });
}
const MAGIC_CATEGORIES: Record<string, string> = {
  'magic-potion': 'glass potion bottle with a stopper',
  'magic-ring': 'ornate ring set with a gem',
  'magic-wand': 'carved wand',
  'magic-rod': 'metal rod with a flanged head',
  'magic-staff': 'tall carved staff',
  'magic-scroll': 'rolled parchment scroll with a wax seal',
  'magic-armor': 'ornate breastplate',
  'magic-weapon': 'ornate sword',
  'magic-wondrous': 'mysterious amulet on a chain',
};
for (const [id, subject] of Object.entries(MAGIC_CATEGORIES)) {
  add({
    id,
    kind: 'items',
    tier: 3,
    aspect: '1:1',
    // Monochrome: the same art serves every rarity; the UI frame shows the rarity color.
    prompt: itemPrompt(`magical ${subject}, faintly shimmering`),
  });
}

const out = resolve(__dirname, '..', 'art', 'prompts.json');
writeFileSync(out, JSON.stringify(entries, null, 2) + '\n');
const byTier = [1, 2, 3].map((t) => `tier ${t}: ${entries.filter((e) => e.tier === t).length}`);
console.log(`${entries.length} prompts (${byTier.join(', ')}) -> art/prompts.json`);
