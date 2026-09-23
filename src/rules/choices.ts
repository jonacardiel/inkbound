/**
 * The generic choice system. Every decision a player makes (subrace, skills,
 * fighting style, expertise, equipment, ASI, spells...) is described as a
 * `Choice`. The creator and the level-up wizard both render these with one
 * picker; nothing here is class-specific UI.
 *
 * Choice ids are stable strings derived from the SRD source:
 *   subrace, subclass
 *   race:<race>:<field>            e.g. race:half-elf:abilityBonusOptions
 *   trait:<trait>:<field>          e.g. trait:skill-versatility:proficiencyChoices
 *   class:<class>:<field>:<n>      e.g. class:rogue:proficiencyChoices:0
 *   feature:<feature>:<field>      e.g. feature:fighter-fighting-style:subfeatureOptions
 *   background:<bg>:<field>
 *   asi:<class>:<level>
 *   spells:<class>:cantrips | spells:<class>:known | spells:<class>:spellbook
 */
import {
  ABILITIES,
  classLevel,
  content,
  equipmentIn,
  spellsFor,
  type SrdChoice,
  type SrdOption,
} from '@/content';

import type { Character } from './character';
import { derive } from './derive';

export type CreatorStep = 'race' | 'class' | 'abilities' | 'background' | 'skills' | 'equipment' | 'spells';
export type ChoiceView = 'artCard' | 'itemCard' | 'spellCard' | 'tile' | 'chip';

export type ChoiceOption = {
  id: string;
  /** Items granted by picking this option (equipment bundles). */
  items?: { id: string; count: number }[];
  /** Further picks unlocked by this option, e.g. "any martial weapon". */
  subChoices?: Choice[];
};

export type Choice = {
  id: string;
  step: CreatorStep;
  label: string;
  count: number;
  options: ChoiceOption[];
  view: ChoiceView;
  /** The level this choice appeared at (for the level-up wizard). */
  level: number;
};

type Opts = { includeEquipment?: boolean };

// --- SRD choice -> app Choice -----------------------------------------------------

function flattenOptions(option: SrdOption): ChoiceOption[] {
  switch (option.kind) {
    case 'ref':
      return [{ id: option.id }];
    case 'abilityBonus':
      return [{ id: option.ability }];
    case 'string':
      return [{ id: option.value }];
    // Nested choices and bundles inside a non-equipment choice (e.g. expertise) are flattened.
    case 'choice':
      return optionsOf(option.choice);
    case 'multiple':
      return option.items.flatMap(flattenOptions);
    default:
      return [];
  }
}

function optionsOf(choice: SrdChoice): ChoiceOption[] {
  switch (choice.from.kind) {
    case 'options':
      return dedupe(choice.from.options.flatMap(flattenOptions));
    case 'equipmentCategory':
      return equipmentIn(choice.from.id).map((id) => ({ id }));
    case 'resourceList':
      return content.languages.all.filter((l) => l.type === 'Standard' || l.type === 'Exotic').map((l) => ({ id: l.index }));
  }
}

const dedupe = (options: ChoiceOption[]) => [...new Map(options.map((o) => [o.id, o])).values()];

/** Picks contributed by one option once flattened: a sub-choice counts its picks, a bundle sums its parts. */
function picksIn(option: SrdOption): number {
  if (option.kind === 'choice') return option.choice.choose;
  if (option.kind === 'multiple') return option.items.reduce((n, o) => n + picksIn(o), 0);
  return 1;
}

/**
 * How many picks a flattened choice needs. Rogue expertise is "choose 1 of
 * [2 skills | 1 skill + thieves' tools]", which flattens to "pick 2".
 */
function countOf(choice: SrdChoice): number {
  if (choice.from.kind === 'options' && choice.from.options.every((o) => o.kind === 'choice' || o.kind === 'multiple')) {
    return Math.max(...choice.from.options.map(picksIn)) * choice.choose;
  }
  return choice.choose;
}

function fromSrd(id: string, srd: SrdChoice, step: CreatorStep, view: ChoiceView, level: number, label?: string): Choice {
  return { id, step, view, level, label: label ?? srd.desc ?? `Choose ${srd.choose}`, count: countOf(srd), options: optionsOf(srd) };
}

/** Equipment options keep their bundle structure: each option grants items and may unlock a sub-pick. */
function equipmentChoice(id: string, srd: SrdChoice): Choice {
  const toOption = (o: SrdOption, i: number): ChoiceOption => {
    const items: { id: string; count: number }[] = [];
    const subChoices: Choice[] = [];
    const visit = (x: SrdOption, path: string) => {
      if (x.kind === 'counted') items.push({ id: x.id, count: x.count });
      else if (x.kind === 'ref') items.push({ id: x.id, count: 1 });
      else if (x.kind === 'multiple') x.items.forEach((y, j) => visit(y, `${path}.${j}`));
      else if (x.kind === 'choice') subChoices.push(fromSrd(`${id}:${path}`, x.choice, 'equipment', 'itemCard', 1));
    };
    visit(o, String(i));
    return { id: String(i), items, subChoices: subChoices.length ? subChoices : undefined };
  };
  const options =
    srd.from.kind === 'options'
      ? srd.from.options.map(toOption)
      : [{ id: '0', subChoices: [fromSrd(`${id}:0`, srd, 'equipment', 'itemCard', 1)] }];
  return { id, step: 'equipment', view: 'itemCard', level: 1, label: srd.desc ?? 'Starting equipment', count: 1, options };
}

// --- Which choices apply to a character -------------------------------------------

/** Every choice that applies to this character at its current level, resolved or not. */
export function allChoices(character: Character, opts: Opts = {}): Choice[] {
  const out: Choice[] = [];
  const race = content.races.get(character.race);
  const entry = character.classes[0];

  // Race
  if (race.subraces.length) {
    out.push({ id: 'subrace', step: 'race', view: 'artCard', level: 1, label: `Choose your ${race.name} lineage`, count: 1, options: race.subraces.map((id) => ({ id })) });
  }
  if (race.abilityBonusOptions) out.push(fromSrd(`race:${race.index}:abilityBonusOptions`, race.abilityBonusOptions, 'abilities', 'chip', 1, 'Increase two ability scores by 1'));
  if (race.languageOptions) out.push(fromSrd(`race:${race.index}:languageOptions`, race.languageOptions, 'background', 'chip', 1, 'Choose an extra language'));

  const subrace = character.subrace ? content.subraces.find(character.subrace) : undefined;
  for (const traitId of [...race.traits, ...(subrace?.racialTraits ?? [])]) {
    const trait = content.traits.find(traitId);
    if (!trait) continue;
    if (trait.proficiencyChoices) out.push(fromSrd(`trait:${trait.index}:proficiencyChoices`, trait.proficiencyChoices, trait.proficiencyChoices.type === 'proficiencies' && optionsOf(trait.proficiencyChoices).every((o) => o.id.startsWith('skill-')) ? 'skills' : 'background', 'tile', 1, trait.name));
    if (trait.languageOptions) out.push(fromSrd(`trait:${trait.index}:languageOptions`, trait.languageOptions, 'background', 'chip', 1, trait.name));
    if (trait.traitSpecific?.subtraitOptions) out.push(fromSrd(`trait:${trait.index}:subtraitOptions`, trait.traitSpecific.subtraitOptions, 'race', 'artCard', 1, trait.name));
    if (trait.traitSpecific?.spellOptions) out.push(fromSrd(`trait:${trait.index}:spellOptions`, trait.traitSpecific.spellOptions, 'spells', 'spellCard', 1, trait.name));
  }

  // Background
  const background = content.backgrounds.find(character.background);
  if (background?.languageOptions) out.push(fromSrd(`background:${background.index}:languageOptions`, background.languageOptions, 'background', 'chip', 1, 'Background languages'));

  if (!entry) return out;
  const cls = content.classes.get(entry.classId);

  // Class skills and tools
  cls.proficiencyChoices.forEach((pc, i) => {
    const isSkills = optionsOf(pc).every((o) => o.id.startsWith('skill-'));
    out.push(fromSrd(`class:${cls.index}:proficiencyChoices:${i}`, pc, isSkills ? 'skills' : 'background', isSkills ? 'tile' : 'chip', 1));
  });
  if (opts.includeEquipment) cls.startingEquipmentOptions.forEach((eo, i) => out.push(equipmentChoice(`class:${cls.index}:startingEquipmentOptions:${i}`, eo)));

  // Subclass, when the class reaches its subclass level
  const subclassLevel = firstSubclassLevel(cls.index);
  if (subclassLevel && entry.level >= subclassLevel) {
    out.push({ id: 'subclass', step: 'class', view: 'artCard', level: subclassLevel, label: `Choose your ${content.subclasses.get(cls.subclasses[0]).subclassFlavor}`, count: 1, options: cls.subclasses.map((id) => ({ id })) });
  }

  // Features with options, and ASIs, level by level
  let previousAsi = 0;
  for (let level = 1; level <= entry.level; level++) {
    const row = classLevel(cls.index, level);
    const featureIds = [...row.features, ...(entry.subclassId ? content.levels.find(`${entry.subclassId}-${level}`)?.features ?? [] : [])];
    for (const featureId of featureIds) {
      const fs = content.features.find(featureId)?.featureSpecific;
      if (!fs) continue;
      const feature = content.features.get(featureId);
      for (const field of ['subfeatureOptions', 'expertiseOptions', 'enemyTypeOptions', 'terrainTypeOptions'] as const) {
        const srd = fs[field];
        if (srd) out.push(fromSrd(`feature:${featureId}:${field}`, srd, field === 'expertiseOptions' ? 'skills' : 'class', field === 'expertiseOptions' ? 'tile' : 'artCard', level, feature.name));
      }
    }
    const asiTotal = row.abilityScoreBonuses ?? 0;
    if (asiTotal > previousAsi) {
      out.push({
        id: `asi:${cls.index}:${level}`,
        step: 'abilities',
        view: 'chip',
        level,
        label: 'Ability Score Improvement: +2 to one ability, +1 to two, or a feat',
        count: 2,
        options: [...ABILITIES.map((a) => ({ id: a })), ...content.feats.all.map((f) => ({ id: f.index }))],
      });
    }
    previousAsi = asiTotal;
  }

  // Spells
  const sheet = derive(character);
  const sc = sheet.spellcasting;
  if (sc) {
    const maxSpellLevel = sc.pactSlots ? sc.pactSlots.level : sc.slots.reduce((hi, n, i) => (n > 0 ? i + 1 : hi), 0);
    const leveled = spellsFor(cls.index, maxSpellLevel).filter((s) => s.level > 0).map((s) => ({ id: s.index }));
    if (sc.cantripsKnown > 0) out.push({ id: `spells:${cls.index}:cantrips`, step: 'spells', view: 'spellCard', level: 1, label: 'Cantrips', count: sc.cantripsKnown, options: spellsFor(cls.index, 0).map((s) => ({ id: s.index })) });
    if (sc.spellsKnown) out.push({ id: `spells:${cls.index}:known`, step: 'spells', view: 'spellCard', level: 1, label: 'Spells known', count: sc.spellsKnown, options: leveled });
    if (sc.spellbookSize) out.push({ id: `spells:${cls.index}:spellbook`, step: 'spells', view: 'spellCard', level: 1, label: 'Spells in your spellbook', count: sc.spellbookSize, options: leveled });
  }

  return out;
}

/** Choices that still need picks. `subrace` and `subclass` live on the character itself. */
export function pendingChoices(character: Character, opts: Opts = {}): Choice[] {
  return allChoices(character, opts).filter((c) => {
    if (c.id === 'subrace') return !character.subrace;
    if (c.id === 'subclass') return !character.classes[0]?.subclassId;
    return (character.choices[c.id]?.length ?? 0) < c.count;
  });
}

/** Drops picks whose choice no longer applies, e.g. after changing race or class. */
export function pruneChoices(character: Character, opts: Opts = { includeEquipment: true }): Character {
  const valid = new Set<string>();
  for (const c of allChoices(character, opts)) {
    valid.add(c.id);
    for (const o of c.options) o.subChoices?.forEach((s) => valid.add(s.id));
  }
  const choices = Object.fromEntries(Object.entries(character.choices).filter(([id]) => valid.has(id)));
  return { ...character, choices };
}

export function firstSubclassLevel(classId: string): number | undefined {
  const subclassId = content.classes.get(classId).subclasses[0];
  const levels = content.levels.all.filter((l) => l.subclass === subclassId).map((l) => l.level);
  return levels.length ? Math.min(...levels) : undefined;
}
