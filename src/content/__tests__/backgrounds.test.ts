import { emptyBio, emptyPlayState, type Character } from '@/rules/character';
import { allChoices, pendingChoices } from '@/rules/choices';
import { finalizeCharacter } from '@/rules/creation';
import { derive } from '@/rules/derive';

import { content, findItem } from '..';
import { EXTRA_BACKGROUNDS } from '../extraBackgrounds';

const fighter = (background: string, choices: Record<string, string[]> = {}): Character => ({
  id: 'x',
  schemaVersion: 1,
  name: 'X',
  race: 'human',
  background,
  classes: [{ classId: 'fighter', level: 1 }],
  abilityMethod: 'standard',
  baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  choices,
  hpRolls: [],
  inventory: [],
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  play: emptyPlayState(),
  bio: emptyBio(),
});

test('13 backgrounds: Acolyte, 3 adapted from SRD 5.2, 9 originals', () => {
  expect(content.backgrounds.all).toHaveLength(13);
  expect(EXTRA_BACKGROUNDS.filter((b) => b.source === 'srd5.2').map((b) => b.index)).toEqual(['criminal', 'sage', 'soldier']);
});

describe.each(EXTRA_BACKGROUNDS.map((b) => [b.index, b] as const))('%s', (_, bg) => {
  test('grants exactly two skills, and every proficiency exists', () => {
    expect(bg.startingProficiencies.filter((p) => p.startsWith('skill-'))).toHaveLength(2);
    for (const p of bg.startingProficiencies) expect([p, Boolean(content.proficiencies.find(p))]).toEqual([p, true]);
  });

  test('all starting gear exists', () => {
    for (const e of bg.startingEquipment) expect([e.equipment, Boolean(findItem(e.equipment))]).toEqual([e.equipment, true]);
  });

  test('its choices are well-formed and, once answered, nothing is left', () => {
    const c = fighter(bg.index);
    const mine = allChoices(c, { includeEquipment: true }).filter((ch) => ch.id.startsWith(`background:${bg.index}`));
    const answers: Record<string, string[]> = {};
    for (const ch of mine) {
      expect(ch.options.length).toBeGreaterThan(0);
      answers[ch.id] = ch.options.slice(0, ch.count).map((o) => o.id);
    }
    const pending = pendingChoices({ ...c, choices: answers }, { includeEquipment: true }).filter((ch) => ch.id.startsWith('background:'));
    expect(pending).toEqual([]);
  });
});

test('Soldier: Athletics and Intimidation, a gaming set, and "gear or 50 gp" pays into the purse', () => {
  const gear = finalizeCharacter(
    fighter('soldier', { 'background:soldier:proficiencyChoices:0': ['dice-set'], 'background:soldier:startingEquipmentOptions:0': ['0'] }),
    'a',
  );
  expect(gear.currency.gp).toBe(14);
  expect(gear.inventory.map((i) => i.itemId)).toEqual(expect.arrayContaining(['spear', 'shortbow', 'healers-kit']));
  expect(gear.inventory.some((i) => i.itemId === 'gp')).toBe(false);

  const gold = finalizeCharacter(fighter('soldier', { 'background:soldier:startingEquipmentOptions:0': ['1'] }), 'b');
  expect(gold.currency.gp).toBe(50);

  const sheet = derive(gear);
  expect(sheet.skills['skill-athletics'].proficient).toBe(true);
  expect(sheet.proficiencies.has('dice-set')).toBe(true);
});

test("Criminal's Alert feat adds proficiency to initiative", () => {
  const plain = derive(fighter('acolyte'));
  const alert = derive(fighter('criminal'));
  expect(alert.initiative).toBe(plain.initiative + plain.profBonus);
});

test('original backgrounds add their fixed gold', () => {
  expect(finalizeCharacter(fighter('highborn'), 'h').currency.gp).toBe(25);
});
