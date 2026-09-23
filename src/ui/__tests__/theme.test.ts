import { classColors, palettes } from '../theme';

const CLASSES = [
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
  'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
];

// Relative luminance per WCAG 2.x.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('every SRD class has a spot color', () => {
  expect(Object.keys(classColors).sort()).toEqual([...CLASSES].sort());
});

test('class colors are distinct', () => {
  expect(new Set(Object.values(classColors)).size).toBe(CLASSES.length);
});

test('class colors are readable as UI accents on the dark table (>= 3:1)', () => {
  for (const [id, color] of Object.entries(classColors)) {
    expect([id, contrast(color, palettes.dark.table) >= 3]).toEqual([id, true]);
  }
});
