import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import type { Character } from '@/rules/character';
import { derive } from '@/rules/derive';
import { useCharacters } from '@/state/characters';
import { classColors } from '@/ui/theme';

/** The character from the route's `id`, its derived sheet, and a way to change it. */
export function useSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const character = useCharacters((s) => s.characters[id]);
  const updateStored = useCharacters((s) => s.update);

  return useMemo(() => {
    if (!character) return undefined;
    const sheet = derive(character);
    const color = classColors[character.classes[0].classId];
    const update = (change: (c: Character) => Character) => updateStored(character.id, change);
    return { character, sheet, color, update };
  }, [character, updateStored]);
}
