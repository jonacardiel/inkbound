import { emptyBio, emptyPlayState, type Character } from '../character';
import { pendingChoices } from '../choices';
import { finalizeCharacter } from '../creation';
import { derive } from '../derive';

const fighterDraft: Character = {
  id: 'draft',
  schemaVersion: 1,
  name: '  Brannoc ',
  race: 'human',
  background: 'acolyte',
  classes: [{ classId: 'fighter', level: 1 }],
  abilityMethod: 'standard',
  baseScores: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
  choices: {
    // (a) chain mail
    'class:fighter:startingEquipmentOptions:0': ['0'],
    // (a) a martial weapon (longsword) and a shield
    'class:fighter:startingEquipmentOptions:1': ['0'],
    'class:fighter:startingEquipmentOptions:1:0.0': ['longsword'],
    // (a) a light crossbow and 20 bolts
    'class:fighter:startingEquipmentOptions:2': ['0'],
    // (b) an explorer's pack
    'class:fighter:startingEquipmentOptions:3': ['1'],
    'background:acolyte:startingEquipmentOptions:0': ['amulet'],
  },
  hpRolls: [],
  inventory: [],
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  play: emptyPlayState(),
  bio: emptyBio(),
};

test('equipment picks become an equipped inventory', () => {
  const c = finalizeCharacter(fighterDraft, 'abc');
  const has = (id: string) => c.inventory.find((i) => i.itemId === id);
  expect(has('chain-mail')).toMatchObject({ equipped: true });
  expect(has('shield')).toMatchObject({ equipped: true });
  expect(has('longsword')).toMatchObject({ equipped: true });
  expect(has('explorers-pack')).toBeDefined();
  expect(has('amulet')).toBeDefined();
  expect(c.currency.gp).toBe(15);
  expect(c.name).toBe('Brannoc');
  expect(c.id).toBe('abc');
});

test('the finished fighter has AC 18 (chain mail + shield) and a longsword attack', () => {
  const sheet = derive(finalizeCharacter(fighterDraft, 'abc'));
  expect(sheet.ac).toBe(18);
  expect(sheet.attacks.map((a) => a.name)).toContain('Longsword');
});

test('no equipment choices remain once all are picked', () => {
  const pending = pendingChoices(fighterDraft, { includeEquipment: true }).filter((c) => c.step === 'equipment');
  expect(pending).toEqual([]);
});

test('custom background asks for two skills and two languages', () => {
  const custom = { ...fighterDraft, background: 'custom', choices: {} };
  const ids = pendingChoices(custom).map((c) => c.id);
  expect(ids).toContain('background:custom:proficiencyChoices');
  expect(ids).toContain('background:custom:languageOptions');
  const withSkills = { ...custom, choices: { 'background:custom:proficiencyChoices': ['skill-stealth', 'skill-arcana'] } };
  expect(derive(withSkills).skills['skill-stealth'].proficient).toBe(true);
});
