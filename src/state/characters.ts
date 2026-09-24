import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Character } from '@/rules/character';
import { persistStorage } from '@/state/storage';

type CharactersState = {
  characters: Record<string, Character>;
  save: (character: Character) => void;
  update: (id: string, change: (c: Character) => Character) => void;
  remove: (id: string) => void;
};

export const useCharacters = create<CharactersState>()(
  persist(
    (set) => ({
      characters: {},
      save: (character) => set((s) => ({ characters: { ...s.characters, [character.id]: character } })),
      update: (id, change) =>
        set((s) => (s.characters[id] ? { characters: { ...s.characters, [id]: change(s.characters[id]) } } : s)),
      remove: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.characters;
          return { characters: rest };
        }),
    }),
    // Bump `version` and add a `migrate` step when Character's shape changes.
    { name: 'characters', storage: persistStorage, version: 1 },
  ),
);
