// Mechanical effects of common SRD magic items. The SRD describes these in prose,
// so the numbers are written out here. Effects apply while the item is attuned.
import type { Ability } from '@/content';

export type ItemEffect = {
  ac?: number;
  saves?: number;
  /** "Your score is N while you wear this" (no effect if already higher). */
  setScore?: { ability: Ability; value: number };
  /** Only works while wearing no armor and using no shield. */
  unarmoredOnly?: boolean;
};

export const ITEM_EFFECTS: Record<string, ItemEffect> = {
  'ring-of-protection': { ac: 1, saves: 1 },
  'cloak-of-protection': { ac: 1, saves: 1 },
  'ioun-stone-of-protection': { ac: 1 },
  'bracers-of-defense': { ac: 2, unarmoredOnly: true },
  'amulet-of-health': { setScore: { ability: 'con', value: 19 } },
  'gauntlets-of-ogre-power': { setScore: { ability: 'str', value: 19 } },
  'headband-of-intellect': { setScore: { ability: 'int', value: 19 } },
  'belt-of-giant-strength-hill': { setScore: { ability: 'str', value: 21 } },
  'belt-of-giant-strength-stone': { setScore: { ability: 'str', value: 23 } },
  'belt-of-giant-strength-frost': { setScore: { ability: 'str', value: 23 } },
  'belt-of-giant-strength-fire': { setScore: { ability: 'str', value: 25 } },
  'belt-of-giant-strength-cloud': { setScore: { ability: 'str', value: 27 } },
  'belt-of-giant-strength-storm': { setScore: { ability: 'str', value: 29 } },
};
