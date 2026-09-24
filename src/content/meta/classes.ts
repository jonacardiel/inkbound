// App-authored (original) flavor for classes. Not SRD text.
import type { Ability } from '../types';

export type Role = 'offense' | 'defense' | 'support' | 'magic' | 'mobility' | 'complexity';

export type ClassMeta = {
  tagline: string;
  /** 1-5 ratings for the role radar chart on the class card. */
  roles: Record<Role, number>;
  newPlayerFriendly: boolean;
  primary: Ability[];
  /** Standard array placement for Quick Build, highest first. */
  quickBuildOrder: Ability[];
  /** Art: the spot color's name and what it lights up (see art/STYLE.md). */
  spot: { colorName: string; element: string };
  /** Art subject for the class card. */
  artSubject: string;
};

export const classMeta: Record<string, ClassMeta> = {
  barbarian: {
    tagline: 'Fury given flesh. Shrugs off blows that would fell anyone else.',
    roles: { offense: 5, defense: 4, support: 1, magic: 0, mobility: 3, complexity: 1 },
    newPlayerFriendly: true,
    primary: ['str'],
    quickBuildOrder: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    spot: { colorName: 'ember orange', element: 'the rage burning in the eyes and along the edge of the greataxe' },
    // Explicit grip: earlier generations showed a free hand clutching an arm, or the axe held upside down.
    artSubject:
      'A towering barbarian in furs, mid-roar, raising a massive two-handed greataxe high above his head; both of his hands grip the lower end of the long wooden haft, one hand above the other, and the broad axe blade is at the top end of the haft, facing forward, ready to strike down; anatomically correct arms and hands',
  },
  bard: {
    tagline: 'Words, songs and secrets, each one a weapon or a blessing.',
    roles: { offense: 2, defense: 2, support: 5, magic: 4, mobility: 3, complexity: 4 },
    newPlayerFriendly: false,
    primary: ['cha'],
    quickBuildOrder: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
    spot: { colorName: 'rose magenta', element: 'the notes of magic spiraling from the lute strings' },
    artSubject: 'A dashing bard in a flowing cape, leaping onto a tavern table while playing a lute',
  },
  cleric: {
    tagline: 'A conduit for divine power: healer, shield and holy fire.',
    roles: { offense: 3, defense: 4, support: 5, magic: 4, mobility: 2, complexity: 3 },
    newPlayerFriendly: true,
    primary: ['wis'],
    quickBuildOrder: ['wis', 'con', 'str', 'dex', 'cha', 'int'],
    spot: { colorName: 'radiant gold', element: 'the holy symbol raised overhead and the light pouring from it' },
    artSubject: 'An armored cleric raising a holy symbol against the darkness, cloak whipping in a holy wind',
  },
  druid: {
    tagline: 'Speaks for the wild and, when needed, becomes it.',
    roles: { offense: 3, defense: 3, support: 4, magic: 5, mobility: 3, complexity: 4 },
    newPlayerFriendly: false,
    primary: ['wis'],
    quickBuildOrder: ['wis', 'con', 'dex', 'int', 'cha', 'str'],
    spot: { colorName: 'leaf green', element: 'the living vines curling up the wooden staff' },
    artSubject: 'A druid half-transformed into a bear, antlers and vines rising around a gnarled staff',
  },
  fighter: {
    tagline: 'Master of arms and armor. Never out of options in a fight.',
    roles: { offense: 4, defense: 5, support: 2, magic: 0, mobility: 3, complexity: 1 },
    newPlayerFriendly: true,
    primary: ['str', 'dex'],
    quickBuildOrder: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    spot: { colorName: 'banner crimson', element: 'the torn war banner and cloak streaming behind' },
    artSubject: 'A battle-scarred fighter in plate armor bracing behind a shield, longsword drawn',
  },
  monk: {
    tagline: 'Body and spirit honed into a single, perfect strike.',
    roles: { offense: 4, defense: 3, support: 1, magic: 1, mobility: 5, complexity: 3 },
    newPlayerFriendly: false,
    primary: ['dex', 'wis'],
    quickBuildOrder: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
    spot: { colorName: 'jade', element: 'the ki energy trailing from the striking fist' },
    artSubject: 'A monk in mid-air flying kick above a temple courtyard, robes swirling',
  },
  paladin: {
    tagline: 'A holy oath forged into armor. Smites what must be smitten.',
    roles: { offense: 5, defense: 5, support: 3, magic: 2, mobility: 2, complexity: 2 },
    newPlayerFriendly: true,
    primary: ['str', 'cha'],
    quickBuildOrder: ['str', 'cha', 'con', 'wis', 'dex', 'int'],
    spot: { colorName: 'azure', element: 'the divine light blazing along the sword as it strikes' },
    artSubject: 'A paladin in gleaming plate bringing a sword down in a smiting blow',
  },
  ranger: {
    tagline: 'Hunter of the borderlands. Never loses a trail.',
    roles: { offense: 4, defense: 3, support: 2, magic: 2, mobility: 4, complexity: 3 },
    newPlayerFriendly: true,
    primary: ['dex', 'wis'],
    quickBuildOrder: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
    spot: { colorName: 'moss olive', element: 'the fletching of the nocked arrow and the hunting hawk' },
    artSubject: 'A hooded ranger drawing a longbow on a cliff edge, a hawk diving past',
  },
  rogue: {
    tagline: 'Strikes from the shadows. Every lock is a suggestion.',
    roles: { offense: 4, defense: 2, support: 2, magic: 0, mobility: 5, complexity: 2 },
    newPlayerFriendly: true,
    primary: ['dex'],
    quickBuildOrder: ['dex', 'con', 'int', 'wis', 'cha', 'str'],
    spot: { colorName: 'pewter silver', element: 'the glint on the twin daggers' },
    artSubject: 'A cloaked rogue dropping from a rooftop onto an unaware guard, twin daggers drawn',
  },
  sorcerer: {
    tagline: 'Magic in the blood. Power that answers only to will.',
    roles: { offense: 5, defense: 1, support: 2, magic: 5, mobility: 2, complexity: 4 },
    newPlayerFriendly: false,
    primary: ['cha'],
    quickBuildOrder: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    spot: { colorName: 'draconic flame orange-red', element: 'the raw magic erupting from the open hands' },
    artSubject: 'A sorcerer with faint draconic scales, wild magic erupting from both hands',
  },
  warlock: {
    tagline: 'Power bought with a pact. The bill always comes due.',
    roles: { offense: 4, defense: 2, support: 2, magic: 4, mobility: 2, complexity: 4 },
    newPlayerFriendly: false,
    primary: ['cha'],
    quickBuildOrder: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    spot: { colorName: 'eldritch violet', element: 'the eldritch blast and the eyes of the looming patron' },
    artSubject: 'A warlock hurling an eldritch blast, a vast shadowy patron looming behind',
  },
  wizard: {
    tagline: 'Reality, rewritten from a spellbook.',
    roles: { offense: 4, defense: 1, support: 3, magic: 5, mobility: 2, complexity: 5 },
    newPlayerFriendly: false,
    primary: ['int'],
    quickBuildOrder: ['int', 'con', 'dex', 'wis', 'cha', 'str'],
    spot: { colorName: 'sapphire blue', element: 'the sigils of the spell being cast from the open spellbook' },
    artSubject: 'A robed wizard casting from an open spellbook as arcane sigils swirl upward',
  },
};
