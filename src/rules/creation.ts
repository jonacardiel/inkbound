// Turns a finished creator draft into a playable Character: starting gear,
// equipped armor and weapons, and background gold.
import { content, findItem } from '@/content';

import type { Character, Currency, InventoryItem } from './character';
import { allChoices } from './choices';

/** Items granted by the class and background, plus every equipment pick. */
export function startingItems(c: Character): { id: string; count: number }[] {
  const cls = content.classes.get(c.classes[0].classId);
  const background = content.backgrounds.find(c.background);
  const items = [...cls.startingEquipment, ...(background?.startingEquipment ?? [])].map((e) => ({ id: e.equipment, count: e.quantity }));

  for (const choice of allChoices(c, { includeEquipment: true }).filter((ch) => ch.step === 'equipment')) {
    for (const value of c.choices[choice.id] ?? []) {
      const picked = choice.options.find((o) => o.id === value);
      if (!picked) continue;
      // A bundle grants its items and sub-picks; a plain option is the item itself.
      if (picked.items || picked.subChoices) {
        items.push(...(picked.items ?? []));
        for (const sub of picked.subChoices ?? []) {
          for (const id of c.choices[sub.id] ?? []) items.push({ id, count: 1 });
        }
      } else {
        items.push({ id: picked.id, count: 1 });
      }
    }
  }
  return items;
}

/** Merges duplicate items and equips the best armor, a shield and weapons. */
function toInventory(items: { id: string; count: number }[]): InventoryItem[] {
  const merged = new Map<string, number>();
  for (const { id, count } of items) merged.set(id, (merged.get(id) ?? 0) + count);

  let armorEquipped = false;
  let shieldEquipped = false;
  let weaponsEquipped = 0;
  return [...merged].map(([itemId, qty]) => {
    const item = findItem(itemId);
    const e = item && 'armorCategory' in item ? item : undefined;
    let equipped = false;
    if (e?.armorCategory === 'Shield' && !shieldEquipped) equipped = shieldEquipped = true;
    else if (e?.armorCategory && e.armorCategory !== 'Shield' && !armorEquipped) equipped = armorEquipped = true;
    const isWeapon = item && 'weaponCategory' in item && item.weaponCategory;
    if (isWeapon && weaponsEquipped < 2) {
      equipped = true;
      weaponsEquipped++;
    }
    return { itemId, qty, equipped };
  });
}

/** The draft with its starting gear equipped, for live previews of AC and attacks. */
export function withStartingGear(draft: Character): Character {
  return { ...draft, inventory: toInventory(startingItems(draft).filter((i) => !COINS.has(i.id))) };
}

/** Coins in starting gear are listed as items with these ids ("gp" x 50); they go to the purse. */
const COINS = new Set<string>(['cp', 'sp', 'ep', 'gp', 'pp']);

export function finalizeCharacter(draft: Character, id: string): Character {
  const background = content.backgrounds.find(draft.background);
  const currency: Currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  if (background?.startingGold) currency[background.startingGold.unit] += background.startingGold.quantity;
  const items = startingItems(draft);
  for (const { id: coin, count } of items) if (COINS.has(coin)) currency[coin as keyof Currency] += count;

  return {
    ...draft,
    id,
    name: draft.name.trim() || 'Unnamed hero',
    inventory: toInventory(items.filter((i) => !COINS.has(i.id))),
    currency,
  };
}
