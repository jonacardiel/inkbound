// Dice rolling: "1d20+5", "2d6+3", "d8", "4d6-1". Randomness is injectable for tests.

export type Rng = () => number;
export type Mode = 'normal' | 'advantage' | 'disadvantage';

export type RollResult = {
  label: string;
  expression: string;
  /** Each die rolled, grouped per term. For d20 with advantage, both dice are listed. */
  dice: { sides: number; results: number[]; kept: number[] }[];
  modifier: number;
  total: number;
  mode: Mode;
  /** Natural 20 / natural 1 on a d20 roll. */
  crit?: 'success' | 'fail';
  at: number;
};

type Term = { count: number; sides: number };

export function parse(expression: string): { terms: Term[]; modifier: number } {
  const clean = expression.replace(/\s+/g, '').toLowerCase();
  if (!/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(clean)) throw new Error(`Bad dice expression: ${expression}`);
  const terms: Term[] = [];
  let modifier = 0;
  for (const m of clean.matchAll(/([+-]?)(\d*d\d+|\d+)/g)) {
    const sign = m[1] === '-' ? -1 : 1;
    if (m[2].includes('d')) {
      const [count, sides] = m[2].split('d');
      if (sign < 0) throw new Error('Subtracting dice is not supported');
      terms.push({ count: Number(count || 1), sides: Number(sides) });
    } else {
      modifier += sign * Number(m[2]);
    }
  }
  return { terms, modifier };
}

const die = (sides: number, rng: Rng) => 1 + Math.floor(rng() * sides);

/**
 * Rolls an expression. Advantage/disadvantage applies to a single d20 term
 * (roll two, keep the higher/lower).
 */
export function roll(expression: string, opts: { label?: string; mode?: Mode; rng?: Rng; critical?: boolean } = {}): RollResult {
  const rng = opts.rng ?? Math.random;
  const mode = opts.mode ?? 'normal';
  const { terms, modifier } = parse(expression);
  const dice = terms.map((t) => {
    // A critical hit doubles the dice, not the modifier.
    const count = opts.critical ? t.count * 2 : t.count;
    if (t.sides === 20 && t.count === 1 && mode !== 'normal') {
      const pair = [die(20, rng), die(20, rng)];
      const kept = mode === 'advantage' ? Math.max(...pair) : Math.min(...pair);
      return { sides: 20, results: pair, kept: [kept] };
    }
    const results = Array.from({ length: count }, () => die(t.sides, rng));
    return { sides: t.sides, results, kept: results };
  });
  const total = dice.reduce((sum, d) => sum + d.kept.reduce((a, b) => a + b, 0), modifier);
  const d20 = dice.find((d) => d.sides === 20 && d.kept.length === 1);
  const crit = d20 ? (d20.kept[0] === 20 ? 'success' : d20.kept[0] === 1 ? 'fail' : undefined) : undefined;
  return { label: opts.label ?? expression, expression, dice, modifier, total, mode, crit, at: Date.now() };
}

/** "1d20+5" for a check with a +5 bonus. */
export const d20Plus = (bonus: number) => (bonus === 0 ? '1d20' : `1d20${bonus > 0 ? '+' : ''}${bonus}`);
