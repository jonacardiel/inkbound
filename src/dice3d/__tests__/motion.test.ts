import { rotate } from '../math';
import { heightAt, IMPACTS, orientationAt, planThrow, squashAt, valueFacingViewer } from '../motion';
import { DICE, polyhedron } from '../polyhedra';

/** Deterministic pseudo-random numbers for repeatable throws. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

describe.each(DICE)('d%i', (sides) => {
  const poly = polyhedron(sides);

  test('every throw lands showing exactly the rolled value', () => {
    for (let value = 1; value <= sides; value++) {
      for (let seed = 1; seed <= 5; seed++) {
        const plan = planThrow(poly, value, seeded(seed * 97 + value));
        expect(valueFacingViewer(poly, orientationAt(plan, 1))).toBe(value);
      }
    }
  });

  test('the landed face points at the viewer (within the small twist)', () => {
    const plan = planThrow(poly, 1, seeded(7));
    const face = poly.faces.find((f) => f.value === 1)!;
    expect(rotate(orientationAt(plan, 1), face.normal)[2]).toBeGreaterThan(0.999);
  });

  test('mid-throw the die is still tumbling (not yet on its final face)', () => {
    const plan = planThrow(poly, 1, seeded(3));
    const mid = orientationAt(plan, 0.3);
    const end = orientationAt(plan, 1);
    expect(mid.some((c, i) => Math.abs(c - end[i]) > 0.05)).toBe(true);
  });
});

test('the die touches the floor at each impact and comes to rest', () => {
  for (const t of IMPACTS) expect(heightAt(t)).toBeCloseTo(0, 1);
  expect(heightAt(1)).toBe(0);
  expect(heightAt(0.2)).toBeGreaterThan(1);
});

test('squash only happens around impacts, strongest on the first', () => {
  expect(squashAt(0.1)).toEqual([1, 1]);
  expect(squashAt(IMPACTS[0])[1]).toBeLessThan(squashAt(IMPACTS[1])[1]);
});

test('an impossible value is rejected', () => {
  expect(() => planThrow(polyhedron(6), 7)).toThrow();
});
