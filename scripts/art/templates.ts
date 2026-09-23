// "Engraved Epic" prompt templates (Gustave Doré × Frazetta-style energy).
// Source of truth for every art prompt; art/STYLE.md documents them.
// Frazetta is described by traits only and never named (his work is still under copyright).
// Nano Banana follows descriptive sentences better than keyword lists, and
// exclusions are phrased positively ("clean and unmarked") rather than as "no X".

export type Spot = { colorName: string; element: string };

const ENGRAVING =
  'A 19th-century wood-engraving illustration in the manner of Gustave Doré: dense, confident cross-hatching in black ink on warm aged paper, dramatic chiaroscuro and an epic sense of scale.';

const HEROIC =
  'The figure is caught in an explosive heroic pose, with cloth and hair swirling in motion, seen from a low heroic camera angle and full of primal energy.';

// The bake-off showed Doré prompts invite a fake "Doré" signature, captions and
// labels, so this is stated explicitly as well as positively.
const CLEAN_PAGE =
  'The page is clean and unmarked apart from the illustration itself: it is purely pictorial, with no writing of any kind anywhere, no signature, no caption, no title and no labels.';

function spotLine(spot?: Spot) {
  return spot
    ? `The whole image is monochrome ink except for one luminous spot color, ${spot.colorName}, which appears only on ${spot.element}.`
    : 'The whole image is monochrome black ink on paper.';
}

/** 3:4 cards: races, classes, subclasses, backgrounds, portraits. */
export function figurePrompt(subject: string, spot?: Spot, opts: { heroic?: boolean } = {}) {
  return [
    ENGRAVING,
    `${subject}.`,
    opts.heroic === false ? '' : HEROIC,
    spotLine(spot),
    'Centered composition with a strong, readable silhouette against a softly vignetted paper background.',
    CLEAN_PAGE,
  ]
    .filter(Boolean)
    .join(' ');
}

/** 1:1 item icons. Bolder, sparser lines so they read at 64 px. */
export function itemPrompt(item: string, spot?: Spot) {
  return [
    `A single ${item} shown alone and centered, in three-quarter view.`,
    'It is drawn as a bold 19th-century wood engraving in the manner of Gustave Doré, with fewer, heavier hatching lines and a simple, instantly readable silhouette.',
    'Black ink on warm aged paper inside a soft oval vignette.',
    spot ? `Monochrome except for a ${spot.colorName} glow on ${spot.element}.` : 'Entirely monochrome ink.',
    'The object fills most of the frame.',
    CLEAN_PAGE.replace('the illustration itself', 'the object itself'),
  ].join(' ');
}

/** 3:4 spell-school card backs: an emblematic scene, no figure required. */
export function schoolPrompt(school: string, motif: string, colorName: string) {
  return [
    ENGRAVING,
    `An emblematic engraving representing the ${school} school of magic: ${motif}.`,
    `The whole image is monochrome ink except for one luminous spot color, ${colorName}, which appears only on the magic itself.`,
    'Symmetrical, decorative composition suitable for the back of a playing card.',
    CLEAN_PAGE,
  ].join(' ');
}

/** Sent with every API call alongside the anchor images. */
export const STYLE_REFERENCE_INSTRUCTION =
  'The attached images are style references only. Match their line work, cross-hatching density, paper tone and single-spot-color treatment exactly, but do not copy their subjects or composition.';
