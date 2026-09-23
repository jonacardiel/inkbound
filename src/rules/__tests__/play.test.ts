import { emptyBio, emptyPlayState, type Character } from '../character';
import { derive } from '../derive';
import { applyDamage, currentHp, heal, levelUp, longRest, setTempHp, shortRest, spendResource, spendSlot } from '../play';

// L3 Human Fighter, CON 14 (+2 incl. human bonus: 13+1): HP (10+2) + 2 × (6+2) = 28.
function fighter(level = 3): Character {
  return {
    id: 'f',
    schemaVersion: 1,
    name: 'F',
    race: 'human',
    background: 'acolyte',
    classes: [{ classId: 'fighter', subclassId: 'champion', level }],
    abilityMethod: 'standard',
    baseScores: { str: 15, dex: 12, con: 13, int: 10, wis: 12, cha: 8 },
    choices: {},
    hpRolls: [],
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    play: emptyPlayState(),
    bio: emptyBio(),
  };
}

test('fixture: 28 max HP', () => expect(derive(fighter()).maxHp).toBe(28));

describe('damage and healing', () => {
  test('temp HP absorbs damage first', () => {
    const c = applyDamage(setTempHp(fighter(), 5), 8).character;
    expect(c.play.tempHp).toBe(0);
    expect(currentHp(c)).toBe(25);
  });
  test('temp HP does not stack', () => {
    expect(setTempHp(setTempHp(fighter(), 5), 3).play.tempHp).toBe(5);
  });
  test('HP stops at 0; overflow of max HP or more is instant death', () => {
    const down = applyDamage(fighter(), 30);
    expect(currentHp(down.character)).toBe(0);
    expect(down.instantDeath).toBe(false);
    expect(applyDamage(fighter(), 28 + 28).instantDeath).toBe(true);
  });
  test('concentration save DC is max(10, half the damage)', () => {
    const concentrating = { ...fighter(), play: { ...emptyPlayState(), concentration: 'bless' } };
    expect(applyDamage(concentrating, 6).concentrationDc).toBe(10);
    expect(applyDamage(concentrating, 24).concentrationDc).toBe(12);
    expect(applyDamage(fighter(), 24).concentrationDc).toBeUndefined();
  });
  test('healing caps at max HP and clears death saves', () => {
    const down = applyDamage(fighter(), 28).character;
    const saving = { ...down, play: { ...down.play, deathSaves: { successes: 1, failures: 2 } } };
    const healed = heal(saving, 100);
    expect(currentHp(healed)).toBe(28);
    expect(healed.play.deathSaves).toEqual({ successes: 0, failures: 0 });
  });
});

describe('resources and rests', () => {
  test('Second Wind and Action Surge are spent and restored on a short rest', () => {
    let c = spendResource(spendResource(fighter(), 'second-wind'), 'action-surge');
    expect(() => spendResource(c, 'second-wind')).toThrow();
    c = shortRest(c);
    expect(c.play.resourcesSpent).toEqual({});
  });
  test('short rest spends hit dice to heal (roll + CON)', () => {
    const hurt = applyDamage(fighter(), 20).character;
    const rested = shortRest(hurt, [6, 3]);
    expect(currentHp(rested)).toBe(8 + 8 + 5);
    expect(rested.play.hitDiceSpent).toBe(2);
    // Only 3 hit dice at level 3
    expect(shortRest(rested, [10, 10]).play.hitDiceSpent).toBe(3);
  });
  test('long rest restores everything and half the hit dice', () => {
    let c = applyDamage(fighter(), 20).character;
    c = { ...c, play: { ...c.play, hitDiceSpent: 3, exhaustion: 2, resourcesSpent: { 'second-wind': 1 } } };
    c = longRest(c);
    expect(currentHp(c)).toBe(28);
    expect(c.play.hitDiceSpent).toBe(2); // regains max(1, floor(3/2)) = 1
    expect(c.play.exhaustion).toBe(1);
    expect(c.play.resourcesSpent).toEqual({});
  });
});

describe('spell slots', () => {
  const wizard: Character = { ...fighter(), classes: [{ classId: 'wizard', level: 3 }] };
  test('slots are spent per level and run out', () => {
    let c = spendSlot(spendSlot(wizard, 2), 2);
    expect(c.play.slotsSpent.slice(0, 2)).toEqual([0, 2]);
    expect(() => spendSlot(c, 2)).toThrow();
    c = longRest(c);
    expect(c.play.slotsSpent[1]).toBe(0);
  });
  test('warlock pact slots come back on a short rest', () => {
    const warlock: Character = { ...fighter(), classes: [{ classId: 'warlock', level: 3 }] };
    const c = spendSlot(spendSlot(warlock, 2), 2);
    expect(c.play.pactSlotsSpent).toBe(2);
    expect(() => spendSlot(c, 2)).toThrow();
    expect(shortRest(c).play.pactSlotsSpent).toBe(0);
  });
});

describe('level up', () => {
  test('average HP by default, rolled HP when given, current HP rises with max', () => {
    const hurt = applyDamage(fighter(), 10).character;
    const up = levelUp(hurt);
    expect(up.classes[0].level).toBe(4);
    expect(derive(up).maxHp).toBe(28 + 6 + 2);
    expect(currentHp(up)).toBe(36 - 10);
    expect(derive(levelUp(fighter(), 10)).maxHp).toBe(28 + 10 + 2);
  });
  test('cannot go past 20', () => {
    expect(() => levelUp(fighter(20))).toThrow();
  });
});
