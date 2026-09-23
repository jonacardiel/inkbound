// Types for the generated SRD data in ./data (see scripts/import-srd.ts).
// References to other content are plain `index` slugs, e.g. "hill-dwarf".

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ABILITIES: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export type SrdOption =
  | { kind: 'ref'; id: string }
  | { kind: 'counted'; id: string; count: number; prerequisites?: { type: string; proficiency?: string }[] }
  | { kind: 'multiple'; items: SrdOption[] }
  | { kind: 'choice'; choice: SrdChoice }
  | { kind: 'string'; value: string }
  | { kind: 'ideal'; desc: string; alignments: string[] }
  | { kind: 'scorePrerequisite'; ability: Ability; minimum: number }
  | { kind: 'abilityBonus'; ability: Ability; bonus: number };

export type SrdChoice = {
  choose: number;
  type: string;
  desc?: string;
  from:
    | { kind: 'options'; options: SrdOption[] }
    | { kind: 'equipmentCategory'; id: string }
    | { kind: 'resourceList'; resource: string };
};

export type AbilityBonus = { abilityScore: Ability; bonus: number };
export type Dice = { diceCount: number; diceValue: number };
export type Counted = { equipment: string; quantity: number };

export type Race = {
  index: string;
  name: string;
  speed: number;
  size: string;
  sizeDescription: string;
  age: string;
  alignment: string;
  abilityBonuses: AbilityBonus[];
  abilityBonusOptions?: SrdChoice;
  languages: string[];
  languageDesc: string;
  languageOptions?: SrdChoice;
  traits: string[];
  subraces: string[];
};

export type Subrace = {
  index: string;
  name: string;
  race: string;
  desc: string;
  abilityBonuses: AbilityBonus[];
  racialTraits: string[];
};

export type Trait = {
  index: string;
  name: string;
  desc: string[];
  races: string[];
  subraces: string[];
  proficiencies: string[];
  proficiencyChoices?: SrdChoice;
  languageOptions?: SrdChoice;
  parent?: string;
  traitSpecific?: {
    subtraitOptions?: SrdChoice;
    spellOptions?: SrdChoice;
    damageType?: string;
    breathWeapon?: unknown;
  };
};

export type ClassSpellcasting = {
  level: number;
  spellcastingAbility: Ability;
  info: { name: string; desc: string[] }[];
};

export type CharClass = {
  index: string;
  name: string;
  hitDie: number;
  proficiencyChoices: SrdChoice[];
  proficiencies: string[];
  savingThrows: Ability[];
  startingEquipment: Counted[];
  startingEquipmentOptions: SrdChoice[];
  subclasses: string[];
  spellcasting?: ClassSpellcasting;
  multiClassing: unknown;
};

export type Subclass = {
  index: string;
  name: string;
  class: string;
  subclassFlavor: string;
  desc: string[];
  spells?: { prerequisites: { index?: string; type: string; name: string }[]; spell: string }[];
};

export type LevelSpellcasting = {
  cantripsKnown?: number;
  spellsKnown?: number;
} & { [K in `spellSlotsLevel${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`]?: number };

export type Level = {
  index: string;
  level: number;
  class: string;
  subclass?: string;
  abilityScoreBonuses?: number;
  profBonus?: number;
  features: string[];
  spellcasting?: LevelSpellcasting;
  classSpecific?: Record<string, number | Dice | unknown>;
  subclassSpecific?: Record<string, unknown>;
};

export type Feature = {
  index: string;
  name: string;
  class: string;
  subclass?: string;
  level: number;
  desc: string[];
  prerequisites: unknown[];
  parent?: string;
  featureSpecific?: {
    subfeatureOptions?: SrdChoice;
    expertiseOptions?: SrdChoice;
    enemyTypeOptions?: SrdChoice;
    terrainTypeOptions?: SrdChoice;
    invocations?: string[];
  };
};

export type Background = {
  index: string;
  name: string;
  startingProficiencies: string[];
  languageOptions?: SrdChoice;
  startingEquipment: Counted[];
  startingEquipmentOptions: SrdChoice[];
  feature: { name: string; desc: string[] };
  personalityTraits: SrdChoice;
  ideals: SrdChoice;
  bonds: SrdChoice;
  flaws: SrdChoice;
};

export type Damage = { damageType?: string; damageDice?: string };

export type Spell = {
  index: string;
  name: string;
  level: number;
  school: string;
  desc: string[];
  higherLevel: string[];
  range: string;
  components: ('V' | 'S' | 'M')[];
  material?: string;
  ritual: boolean;
  concentration: boolean;
  duration: string;
  castingTime: string;
  attackType?: string;
  // Array because a few spells (Flame Strike, Ice Storm, Meteor Swarm) deal two damage types.
  damage?: { damageType?: string; damageAtSlotLevel?: Record<string, string>; damageAtCharacterLevel?: Record<string, string> }[];
  dc?: { dcType: Ability; dcSuccess: string };
  classes: string[];
  subclasses: string[];
};

export type Cost = { quantity: number; unit: 'cp' | 'sp' | 'ep' | 'gp' | 'pp' };

export type Equipment = {
  index: string;
  name: string;
  equipmentCategory: string;
  cost: Cost;
  weight?: number;
  desc?: string[];
  // weapons
  weaponCategory?: 'Simple' | 'Martial';
  weaponRange?: 'Melee' | 'Ranged';
  categoryRange?: string;
  damage?: { damageDice: string; damageType: string };
  twoHandedDamage?: { damageDice: string; damageType: string };
  range?: { normal: number; long?: number };
  throwRange?: { normal: number; long: number };
  properties?: string[];
  // armor
  armorCategory?: 'Light' | 'Medium' | 'Heavy' | 'Shield';
  armorClass?: { base: number; dexBonus: boolean; maxBonus?: number };
  strMinimum?: number;
  stealthDisadvantage?: boolean;
  // gear
  gearCategory?: string;
  toolCategory?: string;
  quantity?: number;
  contents?: { item: string; quantity: number }[];
};

export type MagicItem = {
  index: string;
  name: string;
  equipmentCategory: string;
  rarity: { name: string };
  desc: string[];
  variants: string[];
  variant: boolean;
};

export type EquipmentCategory = { index: string; name: string; equipment: string[] };
export type Skill = { index: string; name: string; abilityScore: Ability; desc: string[] };
export type Proficiency = { index: string; name: string; type: string; classes: string[]; races: string[]; reference: string };
export type Condition = { index: string; name: string; desc: string[] };
export type Feat = { index: string; name: string; desc: string[]; prerequisites: unknown[] };
export type Language = { index: string; name: string; type: string; typicalSpeakers: string[]; script?: string };
export type Named = { index: string; name: string; desc?: string | string[] };
