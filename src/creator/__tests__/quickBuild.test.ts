import { emptyBio } from '@/rules/character';
import { pendingChoices } from '@/rules/choices';
import { withStartingGear } from '@/rules/creation';
import { derive } from '@/rules/derive';
import { draftToCharacter, type Draft } from '@/state/draft';

import { quickBuild } from '../quickBuild';

const draft = (race: string, classId: string): Draft => ({
  race,
  classId,
  background: 'acolyte',
  abilityMethod: 'standard',
  baseScores: {},
  choices: {},
  name: '',
  bio: emptyBio(),
});

const RACES = ['dwarf', 'elf', 'halfling', 'human', 'dragonborn', 'gnome', 'half-elf', 'half-orc', 'tiefling'];
const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];

test.each(CLASSES.flatMap((c) => RACES.map((r) => [r, c])))('%s %s: Quick Build leaves nothing to pick', (race, classId) => {
  const built = quickBuild(draft(race, classId));
  const character = draftToCharacter(built)!;
  expect(pendingChoices(character, { includeEquipment: true }).map((c) => c.id)).toEqual([]);
  expect(Object.keys(built.baseScores)).toHaveLength(6);
});

test('Fighter gets STR 15 first, proficient weapons, and no duplicate skills', () => {
  const built = quickBuild(draft('human', 'fighter'));
  expect(built.baseScores.str).toBe(15);
  const sheet = derive(withStartingGear(draftToCharacter(built)!));
  expect(sheet.attacks.every((a) => a.toHit >= sheet.profBonus - 1)).toBe(true);
  const skills = built.choices['class:fighter:proficiencyChoices:0'];
  expect(new Set(skills).size).toBe(2);
  // Acolyte already grants Insight and Religion.
  expect(skills).not.toContain('skill-insight');
});

test('Cleric without heavy armor proficiency does not take chain mail', () => {
  // A Cleric picks a domain first; Quick Build takes the only SRD one (Life), which grants heavy armor.
  const built = quickBuild(draft('human', 'cleric'));
  expect(built.subclassId).toBe('life');
});

test('Dwarf languages are not re-picked', () => {
  const built = quickBuild(draft('dwarf', 'wizard'));
  expect(built.choices['background:acolyte:languageOptions']).not.toContain('dwarvish');
  expect(built.choices['background:acolyte:languageOptions']).not.toContain('common');
});

test('Wizard gets a beginner-friendly spellbook', () => {
  const built = quickBuild(draft('human', 'wizard'));
  expect(built.choices['spells:wizard:cantrips']).toEqual(['fire-bolt', 'mage-hand', 'light']);
  expect(built.choices['spells:wizard:spellbook']).toEqual(expect.arrayContaining(['magic-missile', 'shield', 'mage-armor', 'sleep']));
});

test('recommended spells are all SRD spells', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../quickBuild.ts'), 'utf8') as string;
  const block = src.slice(src.indexOf('RECOMMENDED_SPELLS'), src.indexOf('};', src.indexOf('RECOMMENDED_SPELLS')));
  const ids = [...block.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
  const { content } = require('@/content');
  expect(ids.filter((id) => !content.spells.find(id))).toEqual([]);
});
