import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Ability } from '@/content';
import { emptyBio, emptyPlayState, type Bio, type Character } from '@/rules/character';
import { pruneChoices } from '@/rules/choices';
import { persistStorage } from '@/state/storage';

/**
 * The character being built in the creator. Race and class stay undefined
 * until picked; everything else mirrors Character so the rules engine can
 * preview it as soon as both are chosen.
 */
export type Draft = {
  race?: string;
  subrace?: string;
  classId?: string;
  subclassId?: string;
  background: string;
  abilityMethod: Character['abilityMethod'];
  /** Unassigned abilities are missing. */
  baseScores: Partial<Record<Ability, number>>;
  /** Four-dice results for the "roll" method, kept so a reload doesn't reroll. */
  rolls?: number[][];
  choices: Record<string, string[]>;
  name: string;
  portrait?: string;
  bio: Bio;
};

const emptyDraft = (): Draft => ({
  background: 'acolyte',
  abilityMethod: 'standard',
  baseScores: {},
  choices: {},
  name: '',
  bio: emptyBio(),
});

/**
 * A Character built from the draft, or undefined until race and class are
 * picked. Unassigned scores count as 10. With `allowNoClass`, a race alone is
 * enough (the class list is empty), which is all race and background picks need.
 */
export function draftToCharacter(d: Draft, id = 'draft', allowNoClass = false): Character | undefined {
  if (!d.race || (!d.classId && !allowNoClass)) return undefined;
  return {
    id,
    schemaVersion: 1,
    name: d.name || 'Unnamed hero',
    portrait: d.portrait,
    race: d.race,
    subrace: d.subrace,
    background: d.background,
    classes: d.classId ? [{ classId: d.classId, subclassId: d.subclassId, level: 1 }] : [],
    abilityMethod: d.abilityMethod,
    baseScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ...d.baseScores },
    choices: d.choices,
    hpRolls: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    play: emptyPlayState(),
    bio: d.bio,
  };
}

/** Removes picks that no longer apply after a race, class or background change. */
function pruned(d: Draft): Draft {
  const c = draftToCharacter(d, 'draft', true);
  return c ? { ...d, choices: pruneChoices(c).choices } : d;
}

type DraftState = {
  draft: Draft;
  set: (change: Partial<Draft>) => void;
  setRace: (race: string) => void;
  setClass: (classId: string) => void;
  setChoice: (id: string, values: string[]) => void;
  reset: () => void;
};

export const useDraft = create<DraftState>()(
  persist(
    (set) => ({
      draft: emptyDraft(),
      set: (change) => set((s) => ({ draft: pruned({ ...s.draft, ...change }) })),
      setRace: (race) =>
        set((s) => (s.draft.race === race ? s : { draft: pruned({ ...s.draft, race, subrace: undefined }) })),
      setClass: (classId) =>
        set((s) => (s.draft.classId === classId ? s : { draft: pruned({ ...s.draft, classId, subclassId: undefined }) })),
      setChoice: (id, values) => set((s) => ({ draft: { ...s.draft, choices: { ...s.draft.choices, [id]: values } } })),
      reset: () => set({ draft: emptyDraft() }),
    }),
    { name: 'creator-draft', storage: persistStorage, version: 1 },
  ),
);
