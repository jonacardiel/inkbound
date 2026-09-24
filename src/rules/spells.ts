// Which spells a character has access to, by how their class learns them.
import { spellsFor } from '@/content';

import type { Character } from './character';
import type { Sheet } from './derive';

export type SpellAccess = {
  cantrips: string[];
  /** Leveled spells the character can cast (or prepare from). */
  spells: string[];
  /** Domain/oath spells: always prepared, don't count against the limit. */
  alwaysPrepared: string[];
  /** True when the character chooses a daily list from `spells` (cleric, druid, paladin, wizard). */
  prepares: boolean;
  highestSlot: number;
};

export function spellAccess(c: Character, sheet: Sheet): SpellAccess | undefined {
  const sc = sheet.spellcasting;
  if (!sc) return undefined;
  const classId = c.classes[0].classId;
  const pick = (key: string) => c.choices[key] ?? [];
  const highestSlot = sc.pactSlots ? sc.pactSlots.level : sc.slots.reduce((hi, n, i) => (n > 0 ? i + 1 : hi), 0);

  const cantrips = [...pick(`spells:${classId}:cantrips`), ...pick('trait:high-elf-cantrip:spellOptions')];
  let spells: string[];
  if (classId === 'wizard') spells = pick('spells:wizard:spellbook');
  else if (sc.preparedMax !== undefined) spells = spellsFor(classId, highestSlot).filter((s) => s.level > 0).map((s) => s.index);
  else spells = pick(`spells:${classId}:known`);

  return { cantrips, spells, alwaysPrepared: sc.alwaysPrepared, prepares: sc.preparedMax !== undefined, highestSlot };
}
