// Golden characters: every expected number here was worked out by hand from the SRD rules.
import type { Ability } from '@/content';

import { emptyBio, emptyPlayState, type Character } from '../character';
import { derive } from '../derive';

type Scores = [number, number, number, number, number, number]; // str dex con int wis cha

function makeCharacter(c: Partial<Character> & { scores: Scores }): Character {
  const abilities: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  return {
    id: 'test',
    schemaVersion: 1,
    name: 'Test',
    race: 'human',
    background: 'acolyte',
    classes: [],
    abilityMethod: 'standard',
    baseScores: Object.fromEntries(abilities.map((a, i) => [a, c.scores[i]])) as Record<Ability, number>,
    choices: {},
    hpRolls: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    play: emptyPlayState(),
    bio: emptyBio(),
    ...c,
  };
}

describe('L1 Hill Dwarf Life Cleric in chain mail and shield', () => {
  const sheet = derive(
    makeCharacter({
      race: 'dwarf',
      subrace: 'hill-dwarf',
      classes: [{ classId: 'cleric', subclassId: 'life', level: 1 }],
      scores: [14, 10, 13, 8, 15, 12],
      inventory: [
        { itemId: 'chain-mail', qty: 1, equipped: true },
        { itemId: 'shield', qty: 1, equipped: true },
      ],
    }),
  );

  test('ability scores include dwarf +2 CON and hill dwarf +1 WIS', () => {
    expect(sheet.abilities.con.score).toBe(15);
    expect(sheet.abilities.wis.score).toBe(16);
    expect(sheet.abilities.wis.mod).toBe(3);
  });
  test('saves: WIS and CHA proficient', () => {
    expect(sheet.abilities.wis.save).toBe(5);
    expect(sheet.abilities.cha.save).toBe(3);
    expect(sheet.abilities.str.save).toBe(2);
  });
  test('HP 8 + CON 2 + Dwarven Toughness 1 = 11', () => expect(sheet.maxHp).toBe(11));
  test('AC chain mail 16 + shield 2 = 18', () => expect(sheet.ac).toBe(18));
  test('speed 25, not reduced by heavy armor', () => expect(sheet.speed).toBe(25));
  test('spellcasting: DC 13, +5, 2 slots, 3 cantrips, prepare 4', () => {
    const s = sheet.spellcasting!;
    expect(s.saveDc).toBe(13);
    expect(s.attackBonus).toBe(5);
    expect(s.slots).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(s.cantripsKnown).toBe(3);
    expect(s.preparedMax).toBe(4);
  });
  test('Life domain spells are always prepared', () => {
    expect(sheet.spellcasting!.alwaysPrepared.sort()).toEqual(['bless', 'cure-wounds']);
  });
  test('passive Perception 13', () => expect(sheet.passivePerception).toBe(13));
});

describe('L5 Half-Orc Berserker Barbarian', () => {
  const character = makeCharacter({
    race: 'half-orc',
    classes: [{ classId: 'barbarian', subclassId: 'berserker', level: 5 }],
    scores: [15, 13, 14, 8, 12, 10],
    choices: { 'asi:barbarian:4': ['str', 'con'] },
    inventory: [{ itemId: 'greataxe', qty: 1, equipped: true }],
  });
  const sheet = derive(character);

  test('STR 18, CON 16 after half-orc bonuses and ASI', () => {
    expect(sheet.abilities.str.score).toBe(18);
    expect(sheet.abilities.con.score).toBe(16);
  });
  test('HP (12+3) + 4 × (7+3) = 55 with average HP', () => expect(sheet.maxHp).toBe(55));
  test('Unarmored Defense 10 + DEX 1 + CON 3 = 14', () => expect(sheet.ac).toBe(14));
  test('speed 30 + Fast Movement 10 = 40', () => expect(sheet.speed).toBe(40));
  test('proficiency +3 and Menacing gives Intimidation', () => {
    expect(sheet.profBonus).toBe(3);
    expect(sheet.skills['skill-intimidation']).toMatchObject({ proficient: true, bonus: 3 });
  });
  test('3 rages per long rest', () => {
    expect(sheet.resources.find((r) => r.id === 'rage')).toMatchObject({ max: 3, reset: 'long' });
  });
  test('greataxe: +7 to hit, 1d12+4, two attacks', () => {
    const axe = sheet.attacks.find((a) => a.name === 'Greataxe')!;
    expect(axe).toMatchObject({ toHit: 7, damage: '1d12+4', damageType: 'slashing' });
    expect(sheet.attacksPerAction).toBe(2);
  });
  test('raging adds +2 damage', () => {
    const raging = derive({ ...character, play: { ...character.play, raging: true } });
    expect(raging.attacks.find((a) => a.name === 'Greataxe')!.damage).toBe('1d12+6');
  });
});

describe('L3 High Elf Evocation Wizard', () => {
  const sheet = derive(
    makeCharacter({
      race: 'elf',
      subrace: 'high-elf',
      classes: [{ classId: 'wizard', subclassId: 'evocation', level: 3 }],
      scores: [8, 14, 13, 15, 12, 10],
    }),
  );

  test('HP (6+1) + 2 × (4+1) = 17', () => expect(sheet.maxHp).toBe(17));
  test('AC 10 + DEX 3 = 13', () => expect(sheet.ac).toBe(13));
  test('slots 4/2, spellbook 10, prepare 6, DC 13', () => {
    const s = sheet.spellcasting!;
    expect(s.slots.slice(0, 3)).toEqual([4, 2, 0]);
    expect(s.spellbookSize).toBe(10);
    expect(s.preparedMax).toBe(6);
    expect(s.saveDc).toBe(13);
  });
  test('High Elf gets a bonus wizard cantrip', () => expect(sheet.spellcasting!.bonusCantrips).toBe(1));
  test('Keen Senses: Perception proficient, passive 13', () => {
    expect(sheet.skills['skill-perception'].proficient).toBe(true);
    expect(sheet.passivePerception).toBe(13);
  });
});

describe('L1 Human Draconic Sorcerer', () => {
  const sheet = derive(
    makeCharacter({
      classes: [{ classId: 'sorcerer', subclassId: 'draconic', level: 1 }],
      scores: [8, 13, 14, 10, 12, 15],
    }),
  );
  test('HP 6 + CON 2 + Draconic Resilience 1 = 9', () => expect(sheet.maxHp).toBe(9));
  test('Draconic Resilience AC 13 + DEX 2 = 15', () => expect(sheet.ac).toBe(15));
  test('2 first-level slots, DC 13', () => {
    expect(sheet.spellcasting!.slots[0]).toBe(2);
    expect(sheet.spellcasting!.saveDc).toBe(13);
  });
});

describe('L5 Lightfoot Halfling Thief Rogue', () => {
  const sheet = derive(
    makeCharacter({
      race: 'halfling',
      subrace: 'lightfoot-halfling',
      classes: [{ classId: 'rogue', subclassId: 'thief', level: 5 }],
      scores: [8, 15, 14, 13, 12, 10],
      choices: {
        'class:rogue:proficiencyChoices:0': ['skill-stealth', 'skill-perception', 'skill-acrobatics', 'skill-sleight-of-hand'],
        'feature:rogue-expertise-1:expertiseOptions': ['skill-stealth', 'skill-perception'],
        'asi:rogue:4': ['dex', 'dex'],
      },
      inventory: [
        { itemId: 'leather-armor', qty: 1, equipped: true },
        { itemId: 'shortsword', qty: 1, equipped: true },
      ],
    }),
  );

  test('DEX 19 (+4) after halfling +2 and ASI +2', () => expect(sheet.abilities.dex).toMatchObject({ score: 19, mod: 4 }));
  test('expertise doubles proficiency: Stealth +10, Acrobatics +7', () => {
    expect(sheet.skills['skill-stealth']).toMatchObject({ expertise: true, bonus: 10 });
    expect(sheet.skills['skill-acrobatics'].bonus).toBe(7);
  });
  test('passive Perception 10 + 1 + 6 = 17', () => expect(sheet.passivePerception).toBe(17));
  test('leather armor AC 11 + 4 = 15', () => expect(sheet.ac).toBe(15));
  test('HP (8+2) + 4 × (5+2) = 38', () => expect(sheet.maxHp).toBe(38));
  test('sneak attack 3d6', () => expect(sheet.sneakAttack).toBe('3d6'));
  test('shortsword uses DEX (finesse): +7, 1d6+4', () => {
    expect(sheet.attacks.find((a) => a.name === 'Shortsword')).toMatchObject({ toHit: 7, damage: '1d6+4' });
  });
});

describe('L3 Tiefling Fiend Warlock', () => {
  const sheet = derive(
    makeCharacter({
      race: 'tiefling',
      classes: [{ classId: 'warlock', subclassId: 'fiend', level: 3 }],
      scores: [8, 13, 14, 10, 12, 15],
    }),
  );
  test('HP (8+2) + 2 × (5+2) = 24', () => expect(sheet.maxHp).toBe(24));
  test('2 pact slots of 2nd level, no regular slots, DC 13', () => {
    const s = sheet.spellcasting!;
    expect(s.pactSlots).toEqual({ count: 2, level: 2 });
    expect(s.slots.every((n) => n === 0)).toBe(true);
    expect(s.saveDc).toBe(13);
  });
});

describe('L4 Human Monk', () => {
  const sheet = derive(
    makeCharacter({
      classes: [{ classId: 'monk', level: 4 }],
      scores: [12, 15, 13, 10, 14, 8],
      choices: { 'asi:monk:4': ['dex', 'dex'] },
    }),
  );
  test('Unarmored Defense 10 + DEX 4 + WIS 2 = 16', () => expect(sheet.ac).toBe(16));
  test('4 ki points per short rest', () => {
    expect(sheet.resources.find((r) => r.id === 'ki')).toMatchObject({ max: 4, reset: 'short' });
  });
  test('speed 30 + Unarmored Movement 10 = 40', () => expect(sheet.speed).toBe(40));
  test('HP (8+2) + 3 × (5+2) = 31', () => expect(sheet.maxHp).toBe(31));
  test('unarmed strike uses the martial arts die: +6, 1d4+4', () => {
    expect(sheet.attacks.find((a) => a.name === 'Unarmed Strike')).toMatchObject({ toHit: 6, damage: '1d4+4' });
  });
});
