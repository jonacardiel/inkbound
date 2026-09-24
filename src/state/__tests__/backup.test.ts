import { emptyBio, emptyPlayState, type Character } from '@/rules/character';

import { backupFileName, parseBackup, toBackup } from '../backup';

const hero = (over: Partial<Character> = {}): Character => ({
  id: 'abc',
  schemaVersion: 1,
  name: 'Thora Emberbraid',
  race: 'dwarf',
  subrace: 'hill-dwarf',
  background: 'acolyte',
  classes: [{ classId: 'cleric', subclassId: 'life', level: 3 }],
  abilityMethod: 'standard',
  baseScores: { str: 13, dex: 12, con: 14, int: 8, wis: 15, cha: 10 },
  choices: { 'spells:cleric:cantrips': ['sacred-flame'] },
  hpRolls: [5, 6],
  inventory: [{ itemId: 'mace', qty: 1, equipped: true }],
  currency: { cp: 0, sp: 0, ep: 0, gp: 15, pp: 0 },
  play: emptyPlayState(),
  bio: emptyBio(),
  ...over,
});

let counter = 0;
const newId = () => `new${++counter}`;

test('a party backup round-trips exactly', () => {
  const party = [hero(), hero({ id: 'def', name: 'Brannoc' })];
  const text = JSON.stringify(toBackup(party));
  const result = parseBackup(text, new Set(), newId);
  expect(result.characters).toEqual(party);
  expect(result.skipped).toEqual([]);
});

test('a single exported character file also imports', () => {
  expect(parseBackup(JSON.stringify(hero()), new Set(), newId).characters).toHaveLength(1);
});

test('an id that already exists gets a new one instead of overwriting', () => {
  const result = parseBackup(JSON.stringify(toBackup([hero()])), new Set(['abc']), newId);
  expect(result.characters[0].id).toMatch(/^new/);
  expect(result.characters[0].name).toBe('Thora Emberbraid');
});

test('phone-only photo portraits are dropped on export; engravings are kept', () => {
  const [photo, engraving] = toBackup([hero({ portrait: 'file:///data/portrait.jpg' }), hero({ portrait: 'art:dwarf-2' })]).characters;
  expect(photo.portrait).toBeUndefined();
  expect(engraving.portrait).toBe('art:dwarf-2');
});

test('invalid characters are skipped with a reason; the rest import', () => {
  const file = toBackup([hero(), hero({ id: 'x', name: 'Ghost', race: 'kenku' }), hero({ id: 'y', name: 'Old', schemaVersion: 2 as 1 })]);
  const result = parseBackup(JSON.stringify(file), new Set(), newId);
  expect(result.characters.map((c) => c.name)).toEqual(['Thora Emberbraid']);
  expect(result.skipped).toEqual([
    { name: 'Ghost', reason: 'unknown race "kenku"' },
    { name: 'Old', reason: 'unsupported format version 2' },
  ]);
});

test('non-JSON files are rejected with a clear message', () => {
  expect(() => parseBackup('not json', new Set(), newId)).toThrow(/isn't a character backup/);
});

test('file names use the hero name, or "party"', () => {
  const now = new Date('2026-09-24T10:00:00Z');
  expect(backupFileName([hero()], now)).toBe('Thora-Emberbraid-2026-09-24.json');
  expect(backupFileName([hero(), hero()], now)).toBe('party-2026-09-24.json');
});
