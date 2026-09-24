import { emptyBio, emptyPlayState, type Character } from '../character';
import { derive } from '../derive';

const fighter = (inventory: Character['inventory']): Character => ({
  id: 'f',
  schemaVersion: 1,
  name: 'F',
  race: 'human',
  background: 'acolyte',
  classes: [{ classId: 'fighter', level: 1 }],
  abilityMethod: 'standard',
  baseScores: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
  choices: {},
  hpRolls: [],
  inventory,
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  play: emptyPlayState(),
  bio: emptyBio(),
});

test('Ring of Protection: +1 AC and saves, only while attuned', () => {
  const base = derive(fighter([]));
  const worn = derive(fighter([{ itemId: 'ring-of-protection', qty: 1 }]));
  const attuned = derive(fighter([{ itemId: 'ring-of-protection', qty: 1, attuned: true }]));
  expect(worn.ac).toBe(base.ac);
  expect(attuned.ac).toBe(base.ac + 1);
  expect(attuned.abilities.wis.save).toBe(base.abilities.wis.save + 1);
});

test('Bracers of Defense only work without armor or shield', () => {
  const bracers = { itemId: 'bracers-of-defense', qty: 1, attuned: true };
  // Human +1 makes DEX 14 (+2).
  expect(derive(fighter([bracers])).ac).toBe(10 + 2 + 2);
  expect(derive(fighter([bracers, { itemId: 'leather-armor', qty: 1, equipped: true }])).ac).toBe(11 + 2);
});

test('Amulet of Health sets CON to 19, raising HP; a Belt of Storm Giant Strength sets STR 29', () => {
  const c = derive(fighter([{ itemId: 'amulet-of-health', qty: 1, attuned: true }]));
  expect(c.abilities.con.score).toBe(19);
  expect(c.maxHp).toBe(10 + 4); // d10 + CON 19 (+4)
  expect(derive(fighter([{ itemId: 'belt-of-giant-strength-storm', qty: 1, attuned: true }])).abilities.str.score).toBe(29);
});

test('"Armor, +1" on chain mail adds 1 AC; "Weapon, +2" on a longsword adds 2 to hit and damage', () => {
  const c = derive(
    fighter([
      { itemId: 'armor-1', baseItemId: 'chain-mail', qty: 1, equipped: true },
      { itemId: 'weapon-2', baseItemId: 'longsword', qty: 1, equipped: true },
    ]),
  );
  expect(c.ac).toBe(16 + 1);
  // STR 16 (+3), proficiency +2, magic +2.
  expect(c.attacks.find((a) => a.name === 'Longsword +2')).toMatchObject({ toHit: 7, damage: '1d8+5' });
});

test('a generic magic item without a base item does nothing', () => {
  expect(derive(fighter([{ itemId: 'armor-3', qty: 1, equipped: true }])).ac).toBe(derive(fighter([])).ac);
});
