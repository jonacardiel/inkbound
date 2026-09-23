// App-authored (original) flavor for races and spell schools. Not SRD text.

export type RaceMeta = {
  tagline: string;
  /** Hex for UI placeholders; colorName + element feed the art prompt. */
  spot: { color: string; colorName: string; element: string };
  artSubject: string;
};

export const raceMeta: Record<string, RaceMeta> = {
  dwarf: {
    tagline: 'Stone-stubborn and forge-proud. Hard to kill, harder to fool.',
    spot: { color: '#E0782F', colorName: 'forge-fire orange', element: 'the glow of the forge fire and the red-hot metal on the anvil' },
    artSubject: 'A stout, braided-bearded dwarf smith hammering at an anvil deep beneath a mountain hall',
  },
  elf: {
    tagline: 'Graceful, long-lived and never quite asleep.',
    spot: { color: '#9DB8E0', colorName: 'moonlight silver-blue', element: 'the moonlight falling across the face and bow' },
    artSubject: 'A slender elf archer poised on a moonlit branch in an ancient forest',
  },
  halfling: {
    tagline: 'Small, lucky and far braver than anyone expects.',
    spot: { color: '#E3B85A', colorName: 'warm hearth gold', element: 'the lantern light spilling around the small figure' },
    artSubject: 'A cheerful halfling adventurer with a walking stick and lantern striding down a country road',
  },
  human: {
    tagline: 'Ambitious, adaptable, everywhere at once.',
    spot: { color: '#C9A45C', colorName: 'brass gold', element: 'the brass compass and map in hand' },
    artSubject: 'A determined human traveler at a crossroads holding a map and compass, city walls on the horizon',
  },
  dragonborn: {
    tagline: 'Draconic blood, dragon breath, a proud and honorable clan.',
    spot: { color: '#E0602F', colorName: 'dragonfire', element: 'the breath weapon roaring from the jaws' },
    artSubject: 'A scaled dragonborn warrior exhaling a torrent of breath weapon, wings of smoke behind',
  },
  gnome: {
    tagline: 'Curious tinkerers with a knack for illusion and mischief.',
    spot: { color: '#3FB8C9', colorName: 'gem cyan', element: 'the gleaming gem inside the clockwork contraption' },
    artSubject: 'An excitable gnome tinkerer holding up a whirring clockwork contraption in a cluttered workshop',
  },
  'half-elf': {
    tagline: 'Of two worlds and at home in both. Charm to spare.',
    spot: { color: '#9A7BD6', colorName: 'twilight violet', element: 'the twilight sky behind the figure' },
    artSubject: 'A half-elf diplomat in traveling clothes on a bridge between a forest and a city at dusk',
  },
  'half-orc': {
    tagline: 'Strength that refuses to fall. Fierce and formidable.',
    spot: { color: '#C23B3B', colorName: 'war-paint red', element: 'the war paint across the face and arms' },
    artSubject: 'A muscular half-orc with tusks, war paint and a greataxe, standing unbowed in a storm',
  },
  tiefling: {
    tagline: 'Infernal heritage and a stare that makes people step back.',
    spot: { color: '#D94A3A', colorName: 'hellfire red', element: 'the glowing eyes and the flame held in the palm' },
    artSubject: 'A horned tiefling with a long tail, conjuring a flame in one palm in a shadowed alley',
  },
};

export const schoolMeta: Record<string, { color: string; colorName: string; motif: string }> = {
  abjuration: { color: '#4C93E6', colorName: 'azure', motif: 'a shimmering protective ward of interlocking runes' },
  conjuration: { color: '#E3B43C', colorName: 'gold', motif: 'a summoning circle with a creature stepping through a rift' },
  divination: { color: '#9DB8E0', colorName: 'silver-blue', motif: 'an all-seeing eye within a crystal ball' },
  enchantment: { color: '#D2508F', colorName: 'rose', motif: 'a spiral of charmed light around an entranced face' },
  evocation: { color: '#E0602F', colorName: 'fiery orange', motif: 'an exploding ball of fire' },
  illusion: { color: '#9A5DD6', colorName: 'violet', motif: 'a mirrored figure dissolving into smoke' },
  necromancy: { color: '#6DAA45', colorName: 'sickly green', motif: 'a skeletal hand rising from a grave' },
  transmutation: { color: '#2FA89A', colorName: 'jade', motif: 'lead transforming into a flowing stream of gold' },
};
