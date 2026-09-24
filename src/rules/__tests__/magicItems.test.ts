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
