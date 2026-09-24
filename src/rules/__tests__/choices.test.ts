import { emptyBio, emptyPlayState, type Character } from '../character';
import { allChoices, firstSubclassLevel, pendingChoices, pruneChoices } from '../choices';

function character(c: Partial<Character>): Character {
  return {
    id: 't',
    schemaVersion: 1,
    name: 'T',
    race: 'human',
    background: 'acolyte',
    classes: [{ classId: 'fighter', level: 1 }],
    abilityMethod: 'standard',
    baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    choices: {},
    hpRolls: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    play: emptyPlayState(),
    bio: emptyBio(),
    ...c,
  };
}

const ids = (c: Character, opts = {}) => pendingChoices(c, opts).map((x) => x.id);

test('subclass levels come from the data', () => {
  expect(firstSubclassLevel('cleric')).toBe(1);
  expect(firstSubclassLevel('wizard')).toBe(2);
  expect(firstSubclassLevel('fighter')).toBe(3);
});

describe('L1 Human Fighter', () => {
  const fighter = character({});
  test('needs 2 skills and a fighting style, but no subclass or ASI yet', () => {
    const pending = pendingChoices(fighter);
    const skills = pending.find((c) => c.id === 'class:fighter:proficiencyChoices:0')!;
    expect(skills).toMatchObject({ count: 2, step: 'skills', view: 'tile' });
    expect(skills.options.map((o) => o.id)).toContain('skill-athletics');
    const style = pending.find((c) => c.id === 'feature:fighter-fighting-style:subfeatureOptions')!;
    expect(style.options.map((o) => o.id)).toContain('fighter-fighting-style-defense');
    expect(ids(fighter)).not.toContain('subclass');
    expect(ids(fighter).some((id) => id.startsWith('asi:'))).toBe(false);
  });

  test('equipment choices keep their bundles and sub-picks', () => {
    const equipment = pendingChoices(fighter, { includeEquipment: true }).filter((c) => c.id.startsWith('class:fighter:startingEquipment'));
    expect(equipment).toHaveLength(4);
    // (a) chain mail, or (b) leather armor + longbow + 20 arrows
    expect(equipment[0].options[0].items).toEqual([{ id: 'chain-mail', count: 1 }]);
    expect(equipment[0].options[1].items).toContainEqual({ id: 'arrow', count: 20 });
    // (a) a martial weapon and a shield: the weapon is a sub-pick from the martial-weapons category
    const sub = equipment[1].options[0].subChoices![0];
    expect(sub.options.map((o) => o.id)).toContain('longsword');
    expect(equipment[1].options[0].items).toEqual([{ id: 'shield', count: 1 }]);
  });

  test('resolved choices disappear from pending', () => {
    const picked = character({ choices: { 'class:fighter:proficiencyChoices:0': ['skill-athletics', 'skill-perception'] } });
    expect(ids(picked)).not.toContain('class:fighter:proficiencyChoices:0');
  });
});

test('L4 fighter gets an ASI and a subclass pick', () => {
  const pending = ids(character({ classes: [{ classId: 'fighter', level: 4 }] }));
  expect(pending).toContain('asi:fighter:4');
  expect(pending).toContain('subclass');
});

test('Half-Elf: +1 to two abilities, two skills and a language', () => {
  const pending = pendingChoices(character({ race: 'half-elf' }));
  expect(pending.find((c) => c.id === 'race:half-elf:abilityBonusOptions')).toMatchObject({ count: 2 });
  expect(pending.find((c) => c.id === 'trait:skill-versatility:proficiencyChoices')).toMatchObject({ count: 2, step: 'skills' });
  expect(pending.map((c) => c.id)).toContain('race:half-elf:languageOptions');
});

test('Dwarves choose a lineage; Dragonborn choose an ancestry', () => {
  expect(ids(character({ race: 'dwarf' }))).toContain('subrace');
  const dragonborn = pendingChoices(character({ race: 'dragonborn' }));
  expect(dragonborn.find((c) => c.id === 'trait:draconic-ancestry:subtraitOptions')?.options).toHaveLength(10);
});

test('Rogue expertise flattens to "pick 2"', () => {
  const rogue = character({ classes: [{ classId: 'rogue', level: 1 }] });
  const expertise = pendingChoices(rogue).find((c) => c.id === 'feature:rogue-expertise-1:expertiseOptions')!;
  expect(expertise.count).toBe(2);
  expect(expertise.options.map((o) => o.id)).toContain('skill-stealth');
});

test('L1 Wizard picks 3 cantrips and 6 spellbook spells from 1st level', () => {
  const wizard = pendingChoices(character({ classes: [{ classId: 'wizard', level: 1 }] }));
  expect(wizard.find((c) => c.id === 'spells:wizard:cantrips')).toMatchObject({ count: 3 });
  const book = wizard.find((c) => c.id === 'spells:wizard:spellbook')!;
  expect(book.count).toBe(6);
  expect(book.options.map((o) => o.id)).toContain('magic-missile');
  expect(book.options.map((o) => o.id)).not.toContain('fireball');
});

test('L1 Cleric must pick a domain', () => {
  expect(ids(character({ classes: [{ classId: 'cleric', level: 1 }] }))).toContain('subclass');
});

test('changing race prunes picks that no longer apply', () => {
  const halfElf = character({
    race: 'half-elf',
    choices: { 'race:half-elf:abilityBonusOptions': ['str', 'con'], 'class:fighter:proficiencyChoices:0': ['skill-athletics', 'skill-history'] },
  });
  const pruned = pruneChoices({ ...halfElf, race: 'human' });
  expect(Object.keys(pruned.choices)).toEqual(['class:fighter:proficiencyChoices:0']);
});

test('every class and race combination produces well-formed choices', () => {
  for (const race of ['dwarf', 'elf', 'halfling', 'human', 'dragonborn', 'gnome', 'half-elf', 'half-orc', 'tiefling']) {
    for (const classId of ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']) {
      for (const level of [1, 5, 20]) {
        const choices = allChoices(character({ race, classes: [{ classId, level }] }), { includeEquipment: level === 1 });
        for (const c of choices) {
          expect([c.id, c.count > 0 && c.options.length > 0]).toEqual([c.id, true]);
        }
      }
    }
  }
});
