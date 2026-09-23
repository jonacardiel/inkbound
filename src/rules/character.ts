import type { Ability } from '@/content';

/**
 * A stored character: only the player's choices and the current play state.
 * Everything else (modifiers, AC, HP max, slots...) is derived in derive.ts.
 * Content is referenced by SRD `index` slugs.
 */
export type Character = {
  id: string;
  schemaVersion: 1;
  name: string;
  portrait?: string;
  race: string;
  subrace?: string;
  background: string;
  /** Array for later multiclassing; the MVP always has exactly one entry. */
  classes: ClassEntry[];
  abilityMethod: 'standard' | 'pointBuy' | 'roll' | 'manual';
  baseScores: Record<Ability, number>;
  /**
   * Every pick the player has made, keyed by a stable ChoiceId (see choices.ts),
   * valued by the chosen SRD ids (or abilities, for ability bonuses and ASIs).
   */
  choices: Record<string, string[]>;
  /** Hit die results for levels 2+; missing entries mean "took the average". */
  hpRolls: number[];
  inventory: InventoryItem[];
  currency: Currency;
  play: PlayState;
  bio: Bio;
};

export type ClassEntry = { classId: string; subclassId?: string; level: number };

export type InventoryItem = {
  /** SRD equipment or magic-item id; omitted for custom items. */
  itemId?: string;
  custom?: { name: string; weight?: number; desc?: string };
  qty: number;
  equipped?: boolean;
  attuned?: boolean;
};

export type Currency = { cp: number; sp: number; ep: number; gp: number; pp: number };

export type PlayState = {
  /** Damage taken from max HP; current HP = max - damage (so max-HP changes keep working). */
  damage: number;
  tempHp: number;
  hitDiceSpent: number;
  deathSaves: { successes: number; failures: number };
  /** Spent slots per spell level, index 0 = 1st level. */
  slotsSpent: number[];
  pactSlotsSpent: number;
  resourcesSpent: Record<string, number>;
  conditions: string[];
  exhaustion: number;
  inspiration: boolean;
  concentration?: string;
  preparedSpells: string[];
  /** Rage and other toggles that change derived numbers. */
  raging?: boolean;
};

export type Bio = {
  alignment?: string;
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  appearance: string;
  notes: string;
};

export const emptyPlayState = (): PlayState => ({
  damage: 0,
  tempHp: 0,
  hitDiceSpent: 0,
  deathSaves: { successes: 0, failures: 0 },
  slotsSpent: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  pactSlotsSpent: 0,
  resourcesSpent: {},
  conditions: [],
  exhaustion: 0,
  inspiration: false,
  preparedSpells: [],
});

export const emptyBio = (): Bio => ({ traits: '', ideals: '', bonds: '', flaws: '', appearance: '', notes: '' });
