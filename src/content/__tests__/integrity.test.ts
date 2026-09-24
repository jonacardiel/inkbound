import { ABILITIES, classLevel, content, findItem, type SrdChoice, type SrdOption } from '..';

const CLASSES = [
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
  'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
];

function optionIds(option: SrdOption): string[] {
  switch (option.kind) {
    case 'ref':
    case 'counted':
      return [option.id];
    case 'multiple':
      return option.items.flatMap(optionIds);
    case 'choice':
      return choiceIds(option.choice);
    default:
      return [];
  }
}

function choiceIds(choice: SrdChoice): string[] {
  return choice.from.kind === 'options' ? choice.from.options.flatMap(optionIds) : [];
}

describe('SRD content', () => {
  test('has the full SRD 5.1 roster', () => {
    expect(content.races.all).toHaveLength(9);
    expect(content.subraces.all).toHaveLength(4);
    expect(content.classes.all.map((c) => c.index).sort()).toEqual(CLASSES);
    expect(content.subclasses.all).toHaveLength(12);
    expect(content.backgrounds.all.map((b) => b.index)).toEqual(['acolyte']);
    expect(content.spells.all.length).toBeGreaterThan(300);
  });

  test.each(CLASSES)('%s has levels 1-20 with proficiency bonus', (classId) => {
    for (let level = 1; level <= 20; level++) {
      const row = classLevel(classId, level);
      expect(row.profBonus).toBe(Math.ceil(level / 4) + 1);
      for (const feature of row.features) expect(content.features.find(feature)).toBeDefined();
    }
  });

  test('race and subrace references resolve', () => {
    for (const race of content.races.all) {
      race.traits.forEach((t) => expect(content.traits.find(t)).toBeDefined());
      race.subraces.forEach((s) => expect(content.subraces.get(s).race).toBe(race.index));
      race.languages.forEach((l) => expect(content.languages.find(l)).toBeDefined());
      race.abilityBonuses.forEach((b) => expect(ABILITIES).toContain(b.abilityScore));
    }
    for (const sub of content.subraces.all) {
      sub.racialTraits.forEach((t) => expect(content.traits.find(t)).toBeDefined());
    }
  });

  test('class references resolve', () => {
    for (const c of content.classes.all) {
      c.subclasses.forEach((s) => expect(content.subclasses.get(s).class).toBe(c.index));
      c.proficiencies.forEach((p) => expect(content.proficiencies.find(p)).toBeDefined());
      c.savingThrows.forEach((a) => expect(ABILITIES).toContain(a));
      c.startingEquipment.forEach((e) => expect(findItem(e.equipment)).toBeDefined());
      c.proficiencyChoices.flatMap(choiceIds).forEach((p) => expect(content.proficiencies.find(p)).toBeDefined());
      c.startingEquipmentOptions.flatMap(choiceIds).forEach((id) => expect(findItem(id)).toBeDefined());
    }
  });

  test('equipment categories used by choices exist and list real items', () => {
    const walk = (choice: SrdChoice): string[] =>
      choice.from.kind === 'equipmentCategory'
        ? [choice.from.id]
        : choice.from.kind === 'options'
          ? choice.from.options.flatMap((o) =>
              o.kind === 'choice' ? walk(o.choice) : o.kind === 'multiple' ? o.items.flatMap((i) => (i.kind === 'choice' ? walk(i.choice) : [])) : [],
            )
          : [];
    const used = content.classes.all.flatMap((c) => c.startingEquipmentOptions.flatMap(walk));
    expect(used.length).toBeGreaterThan(0);
    for (const cat of used) {
      const items = content.equipmentCategories.get(cat).equipment;
      expect(items.length).toBeGreaterThan(0);
      items.forEach((id) => expect(findItem(id)).toBeDefined());
    }
  });

  test('spells reference real classes and schools', () => {
    const classIds = new Set(CLASSES);
    for (const spell of content.spells.all) {
      expect(content.magicSchools.find(spell.school)).toBeDefined();
      spell.classes.forEach((c) => expect(classIds.has(c)).toBe(true));
      expect(spell.level).toBeGreaterThanOrEqual(0);
      expect(spell.level).toBeLessThanOrEqual(9);
    }
  });

  test('skills map to abilities', () => {
    expect(content.skills.all).toHaveLength(18);
    content.skills.all.forEach((s) => expect(ABILITIES).toContain(s.abilityScore));
  });
});

describe('fields the app treats as always present', () => {
  const required: [string, { all: object[] }, string[]][] = [
    ['spells', content.spells, ['index', 'name', 'level', 'school', 'desc', 'range', 'components', 'duration', 'castingTime', 'classes', 'ritual', 'concentration']],
    ['equipment', content.equipment, ['index', 'name', 'equipmentCategory', 'cost']],
    ['features', content.features, ['index', 'name', 'class', 'level', 'desc']],
    ['traits', content.traits, ['index', 'name', 'desc', 'races', 'proficiencies']],
    ['magic items', content.magicItems, ['index', 'name', 'rarity', 'desc', 'equipmentCategory']],
  ];
  test.each(required)('%s have their required fields', (_, table, fields) => {
    for (const row of table.all as Record<string, unknown>[]) {
      const missing = fields.filter((f) => row[f] === undefined);
      expect([row.index, missing]).toEqual([row.index, []]);
    }
  });
});
