import { describe as describeId } from '../describe';

test.each([
  ['skill-stealth', 'Stealth'],
  ['fighter-fighting-style-defense', 'Defense'],
  ['hill-dwarf', 'Hill Dwarf'],
  ['magic-missile', 'Magic Missile'],
  ['longsword', 'Longsword'],
  ['elvish', 'Elvish'],
  ['draconic-ancestry-red', 'Red Dragon'],
  ['str', 'Strength'],
  ['grappler', 'Grappler'],
  ['life', 'Life'],
  ['aberrations', 'Aberrations'],
])('%s is shown as %s', (id, name) => {
  expect(describeId(id).name).toBe(name);
});

test('skills carry a blurb from the SRD', () => {
  expect(describeId('skill-stealth').blurb).toMatch(/\w/);
});
