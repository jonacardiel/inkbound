import { emptyBio, emptyPlayState, type Character } from '../character';
import { derive } from '../derive';
import { addItem, applyDamage, currentHp, deathSave, setExhaustion, toggleCondition, togglePrepared, updateItem } from '../play';

const base: Character = {
  id: 'x',
  schemaVersion: 1,
  name: 'X',
  race: 'human',
  background: 'acolyte',
  classes: [{ classId: 'wizard', level: 1 }],
  abilityMethod: 'standard',
  baseScores: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
  choices: {},
  hpRolls: [],
  inventory: [],
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  play: emptyPlayState(),
  bio: emptyBio(),
};
const down = applyDamage(base, 50).character;

describe('death saves', () => {
  test('three successes stabilize, three failures kill', () => {
    let c = down;
    for (const r of [12, 15]) c = deathSave(c, r).character;
    expect(deathSave(c, 10).outcome).toBe('stable');
    c = down;
    for (const r of [3, 9]) c = deathSave(c, r).character;
    expect(deathSave(c, 5).outcome).toBe('dead');
  });
  test('a natural 1 counts as two failures', () => {
    const r = deathSave(down, 1);
    expect(r.character.play.deathSaves.failures).toBe(2);
  });
  test('a natural 20 brings you back with 1 HP', () => {
    const r = deathSave(down, 20);
    expect(r.outcome).toBe('revived');
    expect(currentHp(r.character)).toBe(1);
  });
});

test('conditions toggle and exhaustion clamps to 0-6', () => {
  const c = toggleCondition(base, 'poisoned');
  expect(c.play.conditions).toEqual(['poisoned']);
  expect(toggleCondition(c, 'poisoned').play.conditions).toEqual([]);
  expect(setExhaustion(base, 9).play.exhaustion).toBe(6);
  expect(setExhaustion(base, -2).play.exhaustion).toBe(0);
});

test('prepared spells toggle', () => {
  const c = togglePrepared(base, 'shield');
  expect(c.play.preparedSpells).toEqual(['shield']);
  expect(togglePrepared(c, 'shield').play.preparedSpells).toEqual([]);
});

describe('inventory', () => {
  test('adding an item you have stacks it', () => {
    const c = addItem(addItem(base, { itemId: 'dagger', qty: 1 }), { itemId: 'dagger', qty: 2 });
    expect(c.inventory).toEqual([{ itemId: 'dagger', qty: 3 }]);
  });
  test('equipping armor changes AC; quantity 0 removes the item', () => {
    let c = addItem(base, { itemId: 'leather-armor', qty: 1 });
    c = updateItem(c, 0, { equipped: true });
    expect(derive(c).ac).toBe(11 + 2);
    expect(updateItem(c, 0, { qty: 0 }).inventory).toEqual([]);
  });
  test('attunement is capped at 3', () => {
    let c = base;
    for (const id of ['ring-of-protection', 'cloak-of-protection', 'amulet-of-health', 'bracers-of-defense']) c = addItem(c, { itemId: id, qty: 1 });
    for (const i of [0, 1, 2]) c = updateItem(c, i, { attuned: true });
    expect(() => updateItem(c, 3, { attuned: true })).toThrow();
  });
});
