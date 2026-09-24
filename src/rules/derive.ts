// Computes the full character sheet from a stored Character. Pure: no React, no I/O.
import { ABILITIES, classLevel, content, subclassLevel, type Ability, type Equipment, type Level } from '@/content';

import type { Character } from './character';
import { ITEM_EFFECTS, type ItemEffect } from './magicItems';
import { resourcesFor, type Resource } from './resources';

export type AbilityLine = { score: number; mod: number; save: number; saveProficient: boolean };
export type SkillLine = { ability: Ability; bonus: number; proficient: boolean; expertise: boolean };
export type Attack = { name: string; itemId?: string; toHit: number; damage: string; damageType: string; range: string };

export type Spellcasting = {
  ability: Ability;
  saveDc: number;
  attackBonus: number;
  cantripsKnown: number;
  /** Extra cantrips from race (High Elf). */
  bonusCantrips: number;
  /** For "known" casters (bard, ranger, sorcerer, warlock). */
  spellsKnown?: number;
  /** For "prepared" casters (cleric, druid, paladin, wizard). */
  preparedMax?: number;
  spellbookSize?: number;
  /** Slots per spell level, index 0 = 1st level. */
  slots: number[];
  pactSlots?: { count: number; level: number };
  alwaysPrepared: string[];
};

export type Sheet = {
  level: number;
  profBonus: number;
  abilities: Record<Ability, AbilityLine>;
  skills: Record<string, SkillLine>;
  maxHp: number;
  hitDie: number;
  ac: number;
  speed: number;
  initiative: number;
  passivePerception: number;
  proficiencies: Set<string>;
  features: string[];
  traits: string[];
  resources: Resource[];
  attacks: Attack[];
  attacksPerAction: number;
  sneakAttack?: string;
  spellcasting?: Spellcasting;
  carryingCapacity: number;
};

const modOf = (score: number) => Math.floor((score - 10) / 2);
const signed = (n: number) => (n === 0 ? '' : n > 0 ? `+${n}` : `${n}`);

/** Weapon item id -> SRD proficiency id, for the few that don't just pluralize. */
const WEAPON_PROFICIENCY: Record<string, string> = {
  'crossbow-light': 'crossbows-light',
  'crossbow-heavy': 'crossbows-heavy',
  'crossbow-hand': 'hand-crossbows',
};

/**
 * Whether a proficiency set covers an item or proficiency id: directly, via
 * its armor category, or via its weapon category / plural weapon proficiency.
 */
export function isProficient(proficiencies: Set<string>, id: string): boolean {
  if (proficiencies.has(id)) return true;
  const item = content.equipment.find(id);
  if (!item) return false;
  if (item.armorCategory) {
    const category = item.armorCategory === 'Shield' ? 'shields' : `${item.armorCategory.toLowerCase()}-armor`;
    return proficiencies.has(category) || proficiencies.has('all-armor');
  }
  if (item.weaponCategory) {
    const category = item.weaponCategory === 'Martial' ? 'martial-weapons' : 'simple-weapons';
    return proficiencies.has(category) || proficiencies.has(WEAPON_PROFICIENCY[id] ?? `${id}s`);
  }
  return false;
}

export function derive(character: Character): Sheet {
  const entry = character.classes[0];
  if (!entry) throw new Error('Character has no class');
  const cls = content.classes.get(entry.classId);
  const level = entry.level;
  const race = content.races.get(character.race);
  const subrace = character.subrace ? content.subraces.get(character.subrace) : undefined;
  const levelRow: Level = classLevel(cls.index, level);
  const profBonus = levelRow.profBonus ?? Math.ceil(level / 4) + 1;
  const choices = character.choices;
  const chosen = (predicate: (key: string) => boolean) =>
    Object.entries(choices)
      .filter(([k]) => predicate(k))
      .flatMap(([, v]) => v);

  // --- Features and traits ---------------------------------------------------
  const features = new Set<string>();
  for (let l = 1; l <= level; l++) {
    classLevel(cls.index, l).features.forEach((f) => features.add(f));
    if (entry.subclassId) subclassLevel(entry.subclassId, l)?.features.forEach((f) => features.add(f));
  }
  const traits = new Set([...race.traits, ...(subrace?.racialTraits ?? [])]);
  const has = (id: string) => features.has(id);
  const choiceValues = new Set(Object.values(choices).flat());

  // --- Ability scores ---------------------------------------------------------
  const scores = { ...character.baseScores };
  for (const b of [...race.abilityBonuses, ...(subrace?.abilityBonuses ?? [])]) scores[b.abilityScore] += b.bonus;
  for (const a of chosen((k) => k.endsWith(':abilityBonusOptions'))) scores[a as Ability] += 1;
  for (const a of chosen((k) => k.startsWith('asi:'))) if (a in scores) scores[a as Ability] += 1;
  for (const a of ABILITIES) scores[a] = Math.min(scores[a], 20);
  const itemEffects: ItemEffect[] = character.inventory
    .filter((i) => i.attuned && i.itemId && ITEM_EFFECTS[i.itemId])
    .map((i) => ITEM_EFFECTS[i.itemId!]);
  for (const e of itemEffects) {
    if (e.setScore) scores[e.setScore.ability] = Math.max(scores[e.setScore.ability], e.setScore.value);
  }
  const itemSaveBonus = itemEffects.reduce((n, e) => n + (e.saves ?? 0), 0);
  const mods = Object.fromEntries(ABILITIES.map((a) => [a, modOf(scores[a])])) as Record<Ability, number>;

  const abilities = Object.fromEntries(
    ABILITIES.map((a) => {
      const saveProficient = cls.savingThrows.includes(a);
      return [a, { score: scores[a], mod: mods[a], saveProficient, save: mods[a] + (saveProficient ? profBonus : 0) + itemSaveBonus }];
    }),
  ) as Record<Ability, AbilityLine>;

  // --- Proficiencies and skills ------------------------------------------------
  const background = content.backgrounds.find(character.background);
  const proficiencies = new Set<string>([
    ...cls.proficiencies,
    ...[...traits].flatMap((t) => content.traits.find(t)?.proficiencies ?? []),
    ...(background?.startingProficiencies ?? []),
    ...chosen((k) => k.includes('proficiencyChoices') || k === 'feature:bonus-proficiencies:skills'),
    // Life domain: "you gain proficiency with heavy armor".
    ...(has('bonus-proficiency') ? ['heavy-armor'] : []),
  ]);
  const expertise = new Set(chosen((k) => k.includes('expertiseOptions')));
  const jackOfAllTrades = has('jack-of-all-trades');
  const remarkableAthlete = has('remarkable-athlete');

  const skills: Record<string, SkillLine> = {};
  for (const skill of content.skills.all) {
    const id = `skill-${skill.index}`;
    const proficient = proficiencies.has(id);
    const isExpert = proficient && expertise.has(id);
    let bonus = mods[skill.abilityScore];
    if (isExpert) bonus += 2 * profBonus;
    else if (proficient) bonus += profBonus;
    else if (jackOfAllTrades) bonus += Math.floor(profBonus / 2);
    else if (remarkableAthlete && ['str', 'dex', 'con'].includes(skill.abilityScore)) bonus += Math.ceil(profBonus / 2);
    skills[id] = { ability: skill.abilityScore, bonus, proficient, expertise: isExpert };
  }

  // --- Hit points ----------------------------------------------------------------
  const hitDie = cls.hitDie;
  let maxHp = hitDie + mods.con;
  for (let l = 2; l <= level; l++) {
    const roll = character.hpRolls[l - 2] ?? hitDie / 2 + 1;
    maxHp += Math.max(1, roll + mods.con);
  }
  if (traits.has('dwarven-toughness')) maxHp += level;
  if (has('draconic-resilience')) maxHp += level;

  // --- Armor class ----------------------------------------------------------------
  // Equipped gear, with generic magic items ("Armor, +1", "Weapon, +2") resolved to their base item.
  type Worn = Equipment & { magicBonus: number; displayName: string };
  const equippedItems: Worn[] = character.inventory
    .filter((i) => i.equipped && i.itemId)
    .flatMap((i): Worn[] => {
      const mundane = content.equipment.find(i.itemId!);
      if (mundane) return [{ ...mundane, magicBonus: 0, displayName: mundane.name }];
      const generic = i.itemId!.match(/^(armor|weapon)-(\d)$/);
      const base = generic && i.baseItemId ? content.equipment.find(i.baseItemId) : undefined;
      if (!generic || !base) return [];
      return [{ ...base, magicBonus: Number(generic[2]), displayName: `${base.name} +${generic[2]}` }];
    });
  const armor = equippedItems.find((e) => e.armorCategory && e.armorCategory !== 'Shield');
  const shield = equippedItems.some((e) => e.armorCategory === 'Shield');
  const fightingStyle = (style: string) => [...choiceValues].some((v) => v.endsWith(`fighting-style-${style}`));

  let ac: number;
  if (armor?.armorClass) {
    const dex = armor.armorClass.dexBonus ? Math.min(mods.dex, armor.armorClass.maxBonus ?? Infinity) : 0;
    ac = armor.armorClass.base + dex + armor.magicBonus + (fightingStyle('defense') ? 1 : 0);
  } else {
    const options = [10 + mods.dex];
    if (has('barbarian-unarmored-defense')) options.push(10 + mods.dex + mods.con);
    if (has('monk-unarmored-defense') && !shield) options.push(10 + mods.dex + mods.wis);
    if (has('draconic-resilience')) options.push(13 + mods.dex);
    ac = Math.max(...options);
  }
  if (shield) ac += 2;
  for (const e of itemEffects) {
    if (e.ac && (!e.unarmoredOnly || (!armor && !shield))) ac += e.ac;
  }

  // --- Speed ----------------------------------------------------------------------
  let speed = race.speed;
  const heavy = armor?.armorCategory === 'Heavy';
  if (heavy && (armor.strMinimum ?? 0) > scores.str && race.index !== 'dwarf') speed -= 10;
  const cs = levelRow.classSpecific ?? {};
  if (typeof cs.unarmoredMovement === 'number' && !armor && !shield) speed += cs.unarmoredMovement;
  if (has('fast-movement') && !heavy) speed += 10;

  // --- Initiative and senses --------------------------------------------------------
  let initiative = mods.dex;
  if (jackOfAllTrades) initiative += Math.floor(profBonus / 2);
  else if (remarkableAthlete) initiative += Math.ceil(profBonus / 2);
  const passivePerception = 10 + skills['skill-perception'].bonus;

  // --- Attacks ----------------------------------------------------------------------
  const rageBonus = character.play.raging && typeof cs.rageDamageBonus === 'number' ? cs.rageDamageBonus : 0;
  const weapons = equippedItems.filter((e) => e.equipmentCategory === 'weapon' && e.damage);
  const attacks: Attack[] = weapons.map((w) => {
    const props = new Set(w.properties ?? []);
    const ranged = w.weaponRange === 'Ranged';
    const ability: Ability = ranged ? 'dex' : props.has('finesse') && mods.dex > mods.str ? 'dex' : 'str';
    const proficient = isProficient(proficiencies, w.index);
    let damageMod = mods[ability] + w.magicBonus;
    let toHit = mods[ability] + (proficient ? profBonus : 0) + w.magicBonus;
    if (ranged && fightingStyle('archery')) toHit += 2;
    if (!ranged && !props.has('two-handed') && weapons.length === 1 && fightingStyle('dueling')) damageMod += 2;
    if (!ranged && ability === 'str') damageMod += rageBonus;
    return {
      name: w.displayName,
      itemId: w.index,
      toHit,
      damage: `${w.damage!.damageDice}${signed(damageMod)}`,
      damageType: w.damage!.damageType,
      range: w.range?.long ? `${w.range.normal}/${w.range.long} ft` : `${w.range?.normal ?? 5} ft`,
    };
  });
  // Unarmed strike: 1 + STR, or the martial arts die with the better of STR/DEX for monks.
  const martialArts = cs.martialArts as { diceCount: number; diceValue: number } | undefined;
  const unarmedAbility: Ability = martialArts && mods.dex > mods.str ? 'dex' : 'str';
  const unarmedMod = mods[unarmedAbility] + (unarmedAbility === 'str' ? rageBonus : 0);
  attacks.push({
    name: 'Unarmed Strike',
    toHit: mods[unarmedAbility] + profBonus,
    damage: martialArts ? `${martialArts.diceCount}d${martialArts.diceValue}${signed(unarmedMod)}` : `${Math.max(1, 1 + unarmedMod)}`,
    damageType: 'bludgeoning',
    range: '5 ft',
  });

  const extraAttacks = typeof cs.extraAttacks === 'number' ? cs.extraAttacks : [...features].some((f) => f.endsWith('extra-attack')) ? 1 : 0;
  const sneak = cs.sneakAttack as { diceCount: number; diceValue: number } | undefined;

  // --- Spellcasting -------------------------------------------------------------------
  let spellcasting: Spellcasting | undefined;
  if (cls.spellcasting && level >= cls.spellcasting.level && levelRow.spellcasting) {
    const ability = cls.spellcasting.spellcastingAbility;
    const row = levelRow.spellcasting;
    const slotCounts = Array.from({ length: 9 }, (_, i) => row[`spellSlotsLevel${(i + 1) as 1}`] ?? 0);
    const isWarlock = cls.index === 'warlock';
    const pactLevel = slotCounts.reduce((hi, n, i) => (n > 0 ? i + 1 : hi), 0);
    const preparedLevel = cls.index === 'paladin' ? Math.floor(level / 2) : level;

    const satisfied = (prereq: { index?: string; type: string }) => {
      if (prereq.type === 'level') return Number(prereq.index?.split('-').pop()) <= level;
      return prereq.index !== undefined && (features.has(prereq.index) || choiceValues.has(prereq.index));
    };
    const subclass = entry.subclassId ? content.subclasses.find(entry.subclassId) : undefined;

    spellcasting = {
      ability,
      saveDc: 8 + profBonus + mods[ability],
      attackBonus: profBonus + mods[ability],
      cantripsKnown: row.cantripsKnown ?? 0,
      bonusCantrips: traits.has('high-elf-cantrip') ? 1 : 0,
      spellsKnown: row.spellsKnown,
      preparedMax: ['cleric', 'druid', 'paladin', 'wizard'].includes(cls.index)
        ? Math.max(1, mods[ability] + preparedLevel)
        : undefined,
      spellbookSize: cls.index === 'wizard' ? 6 + 2 * (level - 1) : undefined,
      slots: isWarlock ? Array(9).fill(0) : slotCounts,
      pactSlots: isWarlock ? { count: slotCounts[pactLevel - 1] ?? 0, level: pactLevel } : undefined,
      alwaysPrepared: (subclass?.spells ?? []).filter((s) => s.prerequisites.every(satisfied)).map((s) => s.spell),
    };
  }

  return {
    level,
    profBonus,
    abilities,
    skills,
    maxHp,
    hitDie,
    ac,
    speed,
    initiative,
    passivePerception,
    proficiencies,
    features: [...features],
    traits: [...traits],
    resources: resourcesFor({ classId: cls.index, level, features, traits, mods, classSpecific: cs }),
    attacks,
    attacksPerAction: 1 + extraAttacks,
    sneakAttack: sneak ? `${sneak.diceCount}d${sneak.diceValue}` : undefined,
    spellcasting,
    carryingCapacity: scores.str * 15,
  };
}
