// Table-time actions. Each returns a new Character; nothing mutates.
import type { Character, PlayState } from './character';
import { derive, type Sheet } from './derive';

const withPlay = (c: Character, play: Partial<PlayState>): Character => ({ ...c, play: { ...c.play, ...play } });

export function currentHp(c: Character, sheet: Sheet = derive(c)): number {
  return Math.max(0, sheet.maxHp - c.play.damage);
}

export type DamageResult = {
  character: Character;
  /** Remaining damage at 0 HP was at least max HP (SRD "Instant Death"). */
  instantDeath: boolean;
  /** CON save DC to keep concentrating, when concentrating. */
  concentrationDc?: number;
};

/** Temp HP absorbs damage first; HP can't drop below 0. */
export function applyDamage(c: Character, amount: number): DamageResult {
  const sheet = derive(c);
  const absorbed = Math.min(c.play.tempHp, amount);
  const rest = amount - absorbed;
  const hp = currentHp(c, sheet);
  const overflow = rest - hp;
  const damage = Math.min(sheet.maxHp, c.play.damage + rest);
  return {
    character: withPlay(c, { tempHp: c.play.tempHp - absorbed, damage }),
    instantDeath: overflow >= sheet.maxHp,
    concentrationDc: c.play.concentration && amount > 0 ? Math.max(10, Math.floor(amount / 2)) : undefined,
  };
}

/** Healing from 0 HP also clears death saves. */
export function heal(c: Character, amount: number): Character {
  return withPlay(c, {
    damage: Math.max(0, c.play.damage - amount),
    deathSaves: amount > 0 ? { successes: 0, failures: 0 } : c.play.deathSaves,
  });
}

/** Temporary HP doesn't stack: keep the higher value. */
export function setTempHp(c: Character, amount: number): Character {
  return withPlay(c, { tempHp: Math.max(c.play.tempHp, amount) });
}

export function spendSlot(c: Character, spellLevel: number): Character {
  const sc = derive(c).spellcasting;
  if (sc?.pactSlots && sc.pactSlots.level > 0) {
    if (c.play.pactSlotsSpent >= sc.pactSlots.count) throw new Error('No pact slots left');
    return withPlay(c, { pactSlotsSpent: c.play.pactSlotsSpent + 1 });
  }
  const max = sc?.slots[spellLevel - 1] ?? 0;
  const spent = [...c.play.slotsSpent];
  if (spent[spellLevel - 1] >= max) throw new Error(`No level ${spellLevel} slots left`);
  spent[spellLevel - 1] += 1;
  return withPlay(c, { slotsSpent: spent });
}

export function spendResource(c: Character, id: string, amount = 1): Character {
  const resource = derive(c).resources.find((r) => r.id === id);
  if (!resource) throw new Error(`Unknown resource ${id}`);
  const spent = (c.play.resourcesSpent[id] ?? 0) + amount;
  if (spent > resource.max) throw new Error(`Not enough ${resource.name}`);
  return withPlay(c, { resourcesSpent: { ...c.play.resourcesSpent, [id]: spent } });
}

/**
 * Short rest: spend hit dice (each roll + CON mod heals), and recover
 * short-rest resources and pact slots.
 */
export function shortRest(c: Character, hitDiceRolls: number[] = []): Character {
  const sheet = derive(c);
  const available = sheet.level - c.play.hitDiceSpent;
  const rolls = hitDiceRolls.slice(0, available);
  const healed = rolls.reduce((sum, r) => sum + Math.max(0, r + sheet.abilities.con.mod), 0);
  const shortIds = new Set(sheet.resources.filter((r) => r.reset === 'short').map((r) => r.id));
  const resourcesSpent = Object.fromEntries(Object.entries(c.play.resourcesSpent).filter(([id]) => !shortIds.has(id)));
  return withPlay(heal(c, healed), {
    hitDiceSpent: c.play.hitDiceSpent + rolls.length,
    resourcesSpent,
    pactSlotsSpent: 0,
  });
}

/**
 * Long rest: full HP, regain half your hit dice (at least 1), all slots and
 * resources, and reduce exhaustion by 1.
 */
export function longRest(c: Character): Character {
  const sheet = derive(c);
  const regained = Math.max(1, Math.floor(sheet.level / 2));
  return withPlay(c, {
    damage: 0,
    tempHp: 0,
    hitDiceSpent: Math.max(0, c.play.hitDiceSpent - regained),
    deathSaves: { successes: 0, failures: 0 },
    slotsSpent: Array(9).fill(0),
    pactSlotsSpent: 0,
    resourcesSpent: {},
    exhaustion: Math.max(0, c.play.exhaustion - 1),
    raging: false,
  });
}

/**
 * Levels a single-class character up. `hpRoll` is the hit die result, or
 * undefined to take the average. New choices then appear in pendingChoices().
 */
export function levelUp(c: Character, hpRoll?: number): Character {
  const entry = c.classes[0];
  if (entry.level >= 20) throw new Error('Already level 20');
  const hpRolls = [...c.hpRolls];
  hpRolls[entry.level - 1] = hpRoll ?? derive(c).hitDie / 2 + 1;
  return { ...c, hpRolls, classes: [{ ...entry, level: entry.level + 1 }] };
}

// --- Death saves, conditions and other toggles ---------------------------------

export type DeathSaveOutcome = 'ongoing' | 'stable' | 'dead' | 'revived';

/**
 * Records a death saving throw roll (d20, no modifiers). 10+ succeeds, a
 * natural 1 counts as two failures, and a natural 20 revives with 1 HP.
 */
export function deathSave(c: Character, d20: number): { character: Character; outcome: DeathSaveOutcome } {
  if (d20 === 20) {
    const sheet = derive(c);
    return { character: withPlay(c, { damage: sheet.maxHp - 1, deathSaves: { successes: 0, failures: 0 } }), outcome: 'revived' };
  }
  const { successes, failures } = c.play.deathSaves;
  const next = d20 === 1 ? { successes, failures: failures + 2 } : d20 >= 10 ? { successes: successes + 1, failures } : { successes, failures: failures + 1 };
  const outcome: DeathSaveOutcome = next.failures >= 3 ? 'dead' : next.successes >= 3 ? 'stable' : 'ongoing';
  return { character: withPlay(c, { deathSaves: { successes: Math.min(3, next.successes), failures: Math.min(3, next.failures) } }), outcome };
}

export function toggleCondition(c: Character, condition: string): Character {
  const has = c.play.conditions.includes(condition);
  return withPlay(c, { conditions: has ? c.play.conditions.filter((x) => x !== condition) : [...c.play.conditions, condition] });
}

export function setExhaustion(c: Character, level: number): Character {
  return withPlay(c, { exhaustion: Math.max(0, Math.min(6, level)) });
}

export function setConcentration(c: Character, spellId?: string): Character {
  return withPlay(c, { concentration: spellId });
}

export function togglePrepared(c: Character, spellId: string): Character {
  const has = c.play.preparedSpells.includes(spellId);
  return withPlay(c, { preparedSpells: has ? c.play.preparedSpells.filter((s) => s !== spellId) : [...c.play.preparedSpells, spellId] });
}

// --- Inventory --------------------------------------------------------------------

export const MAX_ATTUNED = 3;

export function updateItem(c: Character, index: number, change: Partial<Character['inventory'][number]>): Character {
  if (change.attuned && !c.inventory[index].attuned && c.inventory.filter((i) => i.attuned).length >= MAX_ATTUNED) {
    throw new Error(`You can attune to at most ${MAX_ATTUNED} items`);
  }
  const inventory = c.inventory.map((item, i) => (i === index ? { ...item, ...change } : item)).filter((i) => i.qty > 0);
  return { ...c, inventory };
}

export function addItem(c: Character, item: Character['inventory'][number]): Character {
  const existing = item.itemId ? c.inventory.findIndex((i) => i.itemId === item.itemId && !i.custom) : -1;
  if (existing >= 0) return updateItem(c, existing, { qty: c.inventory[existing].qty + item.qty });
  return { ...c, inventory: [...c.inventory, item] };
}

export function setCurrency(c: Character, coin: keyof Character['currency'], amount: number): Character {
  return { ...c, currency: { ...c.currency, [coin]: Math.max(0, Math.floor(amount)) } };
}

/** Starts or ends a rage. Starting one spends a use of the Rage resource. */
export function toggleRage(c: Character): Character {
  if (c.play.raging) return withPlay(c, { raging: false });
  return withPlay(spendResource(c, 'rage'), { raging: true });
}
