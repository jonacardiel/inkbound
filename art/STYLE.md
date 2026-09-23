# Art style: "Engraved Epic"

Gustave Doré's 19th-century wood engraving, combined with heroic, explosive figure energy (Frazetta-like, described by its traits and never named). Every image is monochrome ink on aged paper with **one spot of color that means something**.

- The prompt source of truth is `scripts/art/templates.ts`. Rebuild `art/prompts.json` with `npx tsx scripts/build-prompts.ts`.
- Nano Banana responds best to full descriptive sentences. Exclusions are phrased positively ("the page is clean and unmarked"), not as a list of "no X".

## Spot-color rules
| Subject | Spot color |
|---|---|
| Class cards | The class color, on whatever defines the class (see `src/content/meta/classes.ts`) |
| Race cards | One signature element per race (see `src/content/meta/races.ts`) |
| Spell schools | The school color, on the magic |
| Mundane gear, magic-item art, portraits | None. The UI frame adds rarity or class color. |

## Step 1: bake-off (do this now, in the Gemini app)
Paste each prompt into a **fresh** Gemini chat with Nano Banana. Ask for **3:4** for the two cards and **1:1** for the two icons.
1. Refine the wording over 2–3 rounds. Tell me what you changed, and I'll update the templates to match.
2. Look at the results on your phone at real size. The icons must still read when they're about thumbnail size (64 px).
3. Save the best card as `art/anchors/figure.png` and the best icon as `art/anchors/item.png`. These become the style references for everything else.

The Gemini app adds a visible sparkle watermark on free and AI Pro accounts. That's fine for the bake-off; the final images come from the API instead.

**Dwarf (race card, 3:4)**
> A 19th-century wood-engraving illustration in the manner of Gustave Doré: dense, confident cross-hatching in black ink on warm aged paper, dramatic chiaroscuro and an epic sense of scale. A stout, braided-bearded dwarf smith hammering at an anvil deep beneath a mountain hall. The figure is caught in an explosive heroic pose, with cloth and hair swirling in motion, seen from a low heroic camera angle and full of primal energy. The whole image is monochrome ink except for one luminous spot color, forge-fire orange, which appears only on the glow of the forge fire and the red-hot metal on the anvil. Centered composition with a strong, readable silhouette against a softly vignetted paper background. The page is clean and unmarked apart from the illustration itself.

**Wizard (class card, 3:4)**
> A 19th-century wood-engraving illustration in the manner of Gustave Doré: dense, confident cross-hatching in black ink on warm aged paper, dramatic chiaroscuro and an epic sense of scale. A robed wizard casting from an open spellbook as arcane sigils swirl upward. The figure is caught in an explosive heroic pose, with cloth and hair swirling in motion, seen from a low heroic camera angle and full of primal energy. The whole image is monochrome ink except for one luminous spot color, sapphire blue, which appears only on the sigils of the spell being cast from the open spellbook. Centered composition with a strong, readable silhouette against a softly vignetted paper background. The page is clean and unmarked apart from the illustration itself.

**Longsword (item icon, 1:1)**
> A single longsword shown alone and centered, in three-quarter view. It is drawn as a bold 19th-century wood engraving in the manner of Gustave Doré, with fewer, heavier hatching lines and a simple, instantly readable silhouette. Black ink on warm aged paper inside a soft oval vignette. Entirely monochrome ink. The object fills most of the frame. The page is clean and unmarked apart from the object itself.

**Healing potion (magic item icon, 1:1)**
> A single glass healing potion bottle with a cork stopper shown alone and centered, in three-quarter view. It is drawn as a bold 19th-century wood engraving in the manner of Gustave Doré, with fewer, heavier hatching lines and a simple, instantly readable silhouette. Black ink on warm aged paper inside a soft oval vignette. Monochrome except for a crimson glow on the liquid inside the bottle. The object fills most of the frame. The page is clean and unmarked apart from the object itself.

## Step 2: production (Gemini API, after the anchors are approved)
1. Create an API key in Google AI Studio and put it in `.env` as `GEMINI_API_KEY=...`. That file is git-ignored; add the key yourself.
2. Run `npx tsx scripts/generate-art.ts --tier 1`. It sends each prompt with the anchor images attached as style references, and saves 2 variants per asset to `art/raw/`.
3. Review the variants on the contact sheet and record the winners in `art/approved.json`.

Images cost a few cents each. Check current pricing before a full run; there are about 300 prompts across all tiers.
