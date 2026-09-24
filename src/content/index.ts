// Typed, indexed access to the generated SRD content.
import abilityScoresJson from './data/ability-scores.json';
import alignmentsJson from './data/alignments.json';
import backgroundsJson from './data/backgrounds.json';
import classesJson from './data/classes.json';
import conditionsJson from './data/conditions.json';
import damageTypesJson from './data/damage-types.json';
import equipmentCategoriesJson from './data/equipment-categories.json';
import equipmentJson from './data/equipment.json';
import featsJson from './data/feats.json';
import featuresJson from './data/features.json';
import languagesJson from './data/languages.json';
import levelsJson from './data/levels.json';
import magicItemsJson from './data/magic-items.json';
import magicSchoolsJson from './data/magic-schools.json';
import proficienciesJson from './data/proficiencies.json';
import racesJson from './data/races.json';
import skillsJson from './data/skills.json';
import spellsJson from './data/spells.json';
import subclassesJson from './data/subclasses.json';
import subracesJson from './data/subraces.json';
import traitsJson from './data/traits.json';
import weaponPropertiesJson from './data/weapon-properties.json';
import { EXTRA_BACKGROUNDS } from './extraBackgrounds';
import type {
  Background,
  CharClass,
  Condition,
  Equipment,
  EquipmentCategory,
  Feat,
  Feature,
  Language,
  Level,
  MagicItem,
  Named,
  Proficiency,
  Race,
  Skill,
  Spell,
  Subclass,
  Subrace,
  Trait,
} from './types';

export * from './types';

// JSON imports are typed structurally by TS; the importer guarantees the shape.
const as = <T>(json: unknown) => json as T[];

export type Table<T extends { index: string }> = {
  all: T[];
  get(id: string): T;
  find(id: string): T | undefined;
};

function table<T extends { index: string }>(kind: string, rows: T[]): Table<T> {
  const byId = new Map(rows.map((r) => [r.index, r]));
  return {
    all: rows,
    find: (id) => byId.get(id),
    get(id) {
      const row = byId.get(id);
      if (!row) throw new Error(`Unknown ${kind}: ${id}`);
      return row;
    },
  };
}

export const content = {
  abilityScores: table('ability score', as<Named & { fullName: string }>(abilityScoresJson)),
  alignments: table('alignment', as<Named & { abbreviation: string }>(alignmentsJson)),
  // SRD 5.1's Acolyte, then the adapted SRD 5.2 and original backgrounds.
  backgrounds: table('background', [...as<Background>(backgroundsJson), ...EXTRA_BACKGROUNDS]),
  classes: table('class', as<CharClass>(classesJson)),
  conditions: table('condition', as<Condition>(conditionsJson)),
  damageTypes: table('damage type', as<Named>(damageTypesJson)),
  equipmentCategories: table('equipment category', as<EquipmentCategory>(equipmentCategoriesJson)),
  equipment: table('equipment', as<Equipment>(equipmentJson)),
  feats: table('feat', as<Feat>(featsJson)),
  features: table('feature', as<Feature>(featuresJson)),
  languages: table('language', as<Language>(languagesJson)),
  levels: table('level', as<Level>(levelsJson)),
  magicItems: table('magic item', as<MagicItem>(magicItemsJson)),
  magicSchools: table('magic school', as<Named>(magicSchoolsJson)),
  proficiencies: table('proficiency', as<Proficiency>(proficienciesJson)),
  races: table('race', as<Race>(racesJson)),
  skills: table('skill', as<Skill>(skillsJson)),
  spells: table('spell', as<Spell>(spellsJson)),
  subclasses: table('subclass', as<Subclass>(subclassesJson)),
  subraces: table('subrace', as<Subrace>(subracesJson)),
  traits: table('trait', as<Trait>(traitsJson)),
  weaponProperties: table('weapon property', as<Named>(weaponPropertiesJson)),
};

/** The class level row (e.g. "wizard-3"), or the subclass row when `subclass` is given. */
export function classLevel(classId: string, level: number): Level {
  return content.levels.get(`${classId}-${level}`);
}

export function subclassLevel(subclassId: string, level: number): Level | undefined {
  return content.levels.find(`${subclassId}-${level}`);
}

/** Spells on a class's list, up to a spell level (0 = cantrips). */
export function spellsFor(classId: string, maxLevel: number): Spell[] {
  return content.spells.all.filter((s) => s.classes.includes(classId) && s.level <= maxLevel);
}

/** Item ids in an equipment category, e.g. "martial-weapons". */
export function equipmentIn(categoryId: string): string[] {
  return content.equipmentCategories.get(categoryId).equipment;
}

/** Looks up any item id in mundane equipment first, then magic items. */
export function findItem(id: string): Equipment | MagicItem | undefined {
  return content.equipment.find(id) ?? content.magicItems.find(id);
}
