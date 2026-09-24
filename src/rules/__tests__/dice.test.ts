import { d20Plus, parse, roll, type Rng } from '../dice';

/** An RNG that yields the given die faces for the given die size. */
const faces = (sides: number, ...values: number[]): Rng => {
  let i = 0;
  return () => (values[i++ % values.length] - 1) / sides + 1e-9;
};

test('parses terms and modifiers', () => {
  expect(parse('1d20+5')).toEqual({ terms: [{ count: 1, sides: 20 }], modifier: 5 });
  expect(parse('2d6 + 1d4 - 1')).toEqual({ terms: [{ count: 2, sides: 6 }, { count: 1, sides: 4 }], modifier: -1 });
  expect(parse('d8')).toEqual({ terms: [{ count: 1, sides: 8 }], modifier: 0 });
  expect(() => parse('fireball')).toThrow();
});

test('sums dice and modifier', () => {
  const r = roll('2d6+3', { rng: faces(6, 4, 5) });
  expect(r.dice[0].results).toEqual([4, 5]);
  expect(r.total).toBe(12);
});

test('advantage keeps the higher d20, disadvantage the lower', () => {
  expect(roll('1d20+2', { mode: 'advantage', rng: faces(20, 7, 15) }).total).toBe(17);
  expect(roll('1d20+2', { mode: 'disadvantage', rng: faces(20, 7, 15) }).total).toBe(9);
});

test('natural 20 and natural 1 are flagged', () => {
  expect(roll('1d20+3', { rng: faces(20, 20) }).crit).toBe('success');
  expect(roll('1d20+3', { rng: faces(20, 1) }).crit).toBe('fail');
  expect(roll('1d20+3', { rng: faces(20, 12) }).crit).toBeUndefined();
});

test('critical hits double the dice but not the modifier', () => {
  const r = roll('1d8+3', { critical: true, rng: faces(8, 5, 6) });
  expect(r.dice[0].results).toEqual([5, 6]);
  expect(r.total).toBe(14);
});

test('d20Plus formats bonuses', () => {
  expect(d20Plus(5)).toBe('1d20+5');
  expect(d20Plus(-1)).toBe('1d20-1');
  expect(d20Plus(0)).toBe('1d20');
});

test('every face of every die is reachable and in range', () => {
  for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
    const seen = new Set<number>();
    for (let i = 0; i < 4000; i++) seen.add(roll(`1d${sides}`).total);
    expect(Math.min(...seen)).toBe(1);
    expect(Math.max(...seen)).toBe(sides);
  }
});
