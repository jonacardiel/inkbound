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
