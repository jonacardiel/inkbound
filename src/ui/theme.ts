import { useColorScheme } from 'react-native';

// "Ink and paper; color is earned": the UI is monochrome except for the
// current character's class color (and rarity colors on item frames).

export type Palette = {
  table: string; // app background
  page: string; // card / panel surface (aged paper)
  pageInk: string; // text on a page
  ink: string; // text on the table
  inkMuted: string;
  rule: string; // thin borders and dividers
  accent: string; // default highlight when no class color applies
};

export const palettes: Record<'dark' | 'light', Palette> = {
  dark: {
    table: '#16120F',
    page: '#E9DFC9',
    pageInk: '#1E1812',
    ink: '#EDE3CF',
    inkMuted: '#A89A84',
    rule: '#4A3F33',
    accent: '#C9A45C',
  },
  light: {
    table: '#F3EBDA',
    page: '#FBF6EA',
    pageInk: '#1E1812',
    ink: '#1E1812',
    inkMuted: '#6B5E4E',
    rule: '#CDBFA5',
    accent: '#8A6A26',
  },
};

// One spot color per class. Checked for contrast on the dark table; the class
// sigil also carries identity so color is never the only cue.
export const classColors: Record<string, string> = {
  barbarian: '#E0602F', // ember
  bard: '#D2508F', // rose
  cleric: '#E3B43C', // radiant gold
  druid: '#6DAA45', // leaf green
  fighter: '#C23B3B', // banner crimson
  monk: '#2FA89A', // jade ki
  paladin: '#4C93E6', // azure
  ranger: '#9A8A3A', // moss olive
  rogue: '#8C8FA3', // shadow pewter
  sorcerer: '#F07A4A', // draconic flame
  warlock: '#9A5DD6', // eldritch violet
  wizard: '#3F63D9', // sapphire
};

export const rarityColors: Record<string, string> = {
  common: '#A89A84',
  uncommon: '#4FAF5A',
  rare: '#3F7FE0',
  'very rare': '#9A5DD6',
  legendary: '#E8892B',
  artifact: '#D94A3A',
};

export const fonts = {
  display: 'OldStandardTT_700Bold',
  displayRegular: 'OldStandardTT_400Regular',
  body: 'AtkinsonHyperlegible_400Regular',
  bodyBold: 'AtkinsonHyperlegible_700Bold',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export function usePalette(): Palette {
  const scheme = useColorScheme();
  return scheme === 'light' ? palettes.light : palettes.dark;
}
