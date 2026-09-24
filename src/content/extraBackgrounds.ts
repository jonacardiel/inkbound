// Backgrounds beyond the one in SRD 5.1:
// - Criminal, Sage and Soldier are adapted from SRD 5.2 (CC-BY-4.0, see Credits).
//   Their 2024 ability-score bonuses are left out (this app uses the 2014 rules,
//   where race grants those); their origin feat is included as the feature.
// - The rest are original to Inkbound: familiar archetypes, written fresh.
import type { Background, SrdChoice } from './types';

export type ExtraBackground = Background & {
  source: 'srd5.2' | 'inkbound';
  tagline: string;
  /** Subject for the background's card art (see scripts/build-prompts.ts). */
  artSubject: string;
};

const ARTISANS_TOOLS = [
  'alchemists-supplies', 'brewers-supplies', 'calligraphers-supplies', 'carpenters-tools', 'cartographers-tools',
  'cobblers-tools', 'cooks-utensils', 'glassblowers-tools', 'jewelers-tools', 'leatherworkers-tools', 'masons-tools',
  'painters-supplies', 'potters-tools', 'smiths-tools', 'tinkers-tools', 'weavers-tools', 'woodcarvers-tools',
];
const GAMING_SETS = ['dice-set', 'playing-card-set'];
const INSTRUMENTS = ['bagpipes', 'drum', 'dulcimer', 'flute', 'lute', 'lyre', 'horn', 'pan-flute', 'shawm', 'viol'];

/** "Choose N of these proficiencies." */
const pick = (choose: number, ids: string[], desc: string): SrdChoice => ({
  choose,
  type: 'proficiencies',
  desc,
  from: { kind: 'options', options: ids.map((id) => ({ kind: 'ref', id })) },
});

const anyLanguages = (choose: number): SrdChoice => ({ choose, type: 'languages', from: { kind: 'resourceList', resource: 'languages' } });

/** "(A) this gear, or (B) this much gold", as in SRD 5.2. `gp` is paid into the coin purse. */
const gearOrGold = (items: [string, number][], gold: number): SrdChoice => ({
  choose: 1,
  type: 'equipment',
  desc: `The starting gear, or ${gold} gp to buy your own`,
  from: {
    kind: 'options',
    options: [
      { kind: 'multiple', items: items.map(([id, count]) => ({ kind: 'counted', id, count })) },
      { kind: 'counted', id: 'gp', count: gold },
    ],
  },
});

const noPersonality: SrdChoice = { choose: 1, type: 'string', from: { kind: 'options', options: [] } };
const personality = { personalityTraits: noPersonality, ideals: noPersonality, bonds: noPersonality, flaws: noPersonality };

export const EXTRA_BACKGROUNDS: ExtraBackground[] = [
  // --- Adapted from SRD 5.2 ------------------------------------------------------------
  {
    index: 'criminal',
    name: 'Criminal',
    source: 'srd5.2',
    tagline: 'Locks, lookouts and a knack for being elsewhere when trouble arrives.',
    artSubject: 'A hooded thief crouched on a rain-slick rooftop at night, a ring of lockpicks in hand, the city below',
    startingProficiencies: ['skill-sleight-of-hand', 'skill-stealth', 'thieves-tools'],
    startingEquipment: [],
    startingEquipmentOptions: [gearOrGold([['dagger', 2], ['thieves-tools', 1], ['crowbar', 1], ['pouch', 2], ['clothes-travelers', 1], ['gp', 16]], 50)],
    feature: {
      name: 'Origin Feat: Alert',
      desc: [
        'Initiative Proficiency. When you roll Initiative, you can add your Proficiency Bonus to the roll.',
        "Initiative Swap. Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can't make this swap if you or the ally has the Incapacitated condition.",
      ],
    },
    originFeat: 'alert',
    ...personality,
  },
  {
    index: 'sage',
    name: 'Sage',
    source: 'srd5.2',
    tagline: 'Years among dusty shelves taught you where every answer hides.',
    artSubject: 'A scholar at a candlelit desk in a towering library, surrounded by stacks of books and scrolls, quill raised',
    startingProficiencies: ['skill-arcana', 'skill-history', 'calligraphers-supplies'],
    startingEquipment: [],
    startingEquipmentOptions: [gearOrGold([['quarterstaff', 1], ['calligraphers-supplies', 1], ['book', 1], ['parchment-one-sheet', 8], ['robes', 1], ['gp', 8]], 50)],
    feature: {
      name: 'Origin Feat: Magic Initiate',
      desc: [
        'Two Cantrips. You learn two cantrips of your choice from the Cleric, Druid, or Wizard spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat\'s spells (choose when you select this feat).',
        'Level 1 Spell. Choose a level 1 spell from the same list you selected for this feat\'s cantrips. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.',
        'Spell Change. Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.',
      ],
    },
    ...personality,
  },
  {
    index: 'soldier',
    name: 'Soldier',
    source: 'srd5.2',
    tagline: 'Drilled, scarred and steady when the lines start to break.',
    artSubject: 'A veteran soldier in a battered gambeson planting a spear beside a torn battle standard on a smoky field',
    startingProficiencies: ['skill-athletics', 'skill-intimidation'],
    proficiencyChoices: [pick(1, GAMING_SETS, 'A gaming set you played in camp')],
    startingEquipment: [],
    startingEquipmentOptions: [gearOrGold([['spear', 1], ['shortbow', 1], ['arrow', 20], ['dice-set', 1], ['healers-kit', 1], ['quiver', 1], ['clothes-travelers', 1], ['gp', 14]], 50)],
    feature: {
      name: 'Origin Feat: Savage Attacker',
      desc: ["You've trained to deal particularly damaging strikes. Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll against the target."],
    },
    ...personality,
  },

  // --- Original to Inkbound ------------------------------------------------------------
  {
    index: 'deckhand',
    name: 'Deckhand',
    source: 'inkbound',
    tagline: 'Salt in your blood, rope-burn on your palms, a port in every story.',
    artSubject: 'A weathered deckhand hauling on rigging ropes as a sailing ship pitches through towering waves',
    startingProficiencies: ['skill-athletics', 'skill-perception', 'navigators-tools', 'water-vehicles'],
    startingEquipment: [
      { equipment: 'club', quantity: 1 },
      { equipment: 'rope-silk-50-feet', quantity: 1 },
      { equipment: 'clothes-common', quantity: 1 },
      { equipment: 'pouch', quantity: 1 },
    ],
    startingEquipmentOptions: [],
    startingGold: { quantity: 10, unit: 'gp' },
    feature: {
      name: 'Friends in Every Harbor',
      desc: [
        'Dockworkers, ferrymen and ship crews treat you as one of their own. In any port you can find a berth on a vessel heading your way, working for your passage instead of paying for it, and hear the waterfront gossip before the town does.',
      ],
    },
    ...personality,
  },
  {
    index: 'highborn',
    name: 'Highborn',
    source: 'inkbound',
    tagline: 'A name that opens doors, and the weight of living up to it.',
    artSubject: 'A young noble in a fine embroidered coat standing on a sweeping marble staircase beneath family banners',
    startingProficiencies: ['skill-history', 'skill-persuasion'],
    proficiencyChoices: [pick(1, GAMING_SETS, 'A pastime of the idle rich')],
    languageOptions: anyLanguages(1),
    startingEquipment: [
      { equipment: 'clothes-fine', quantity: 1 },
      { equipment: 'signet-ring', quantity: 1 },
      { equipment: 'pouch', quantity: 1 },
    ],
    startingEquipmentOptions: [],
    startingGold: { quantity: 25, unit: 'gp' },
    feature: {
      name: 'Weight of a Name',
      desc: [
        'Your family is known in the halls of power. Common folk defer to you, and those of rank grant you an audience, a seat at their table, or a letter of introduction, so long as you uphold the family\'s reputation.',
      ],
    },
    ...personality,
  },
  {
    index: 'troubadour',
    name: 'Troubadour',
    source: 'inkbound',
    tagline: 'Every crowd is an audience; every tavern, a stage.',
    artSubject: 'A troubadour in a patched costume tumbling across a wagon stage before a cheering village crowd',
    startingProficiencies: ['skill-acrobatics', 'skill-performance', 'disguise-kit'],
    proficiencyChoices: [pick(1, INSTRUMENTS, 'Your instrument')],
    startingEquipment: [
      { equipment: 'clothes-costume', quantity: 1 },
      { equipment: 'pouch', quantity: 1 },
    ],
    startingEquipmentOptions: [{ choose: 1, type: 'equipment', desc: 'Your instrument', from: { kind: 'equipmentCategory', id: 'musical-instruments' } }],
    startingGold: { quantity: 15, unit: 'gp' },
    feature: {
      name: 'Crowd Favorite',
      desc: [
        'Wherever there is an inn, a fair or a noble\'s feast, you can earn a free room and meals by performing. Locals who have seen your act recognize you warmly and are inclined to share news and rumors.',
      ],
    },
    ...personality,
  },
  {
    index: 'recluse',
    name: 'Recluse',
    source: 'inkbound',
    tagline: 'You left the world behind, and came back knowing something it forgot.',
    artSubject: 'A robed recluse tending herbs outside a tiny stone hut on a lonely mountainside at dawn',
    startingProficiencies: ['skill-medicine', 'skill-religion', 'herbalism-kit'],
    languageOptions: anyLanguages(1),
    startingEquipment: [
      { equipment: 'case-map-or-scroll', quantity: 1 },
      { equipment: 'blanket', quantity: 1 },
      { equipment: 'clothes-common', quantity: 1 },
      { equipment: 'herbalism-kit', quantity: 1 },
    ],
    startingEquipmentOptions: [],
    startingGold: { quantity: 5, unit: 'gp' },
    feature: {
      name: 'Hard-Won Insight',
      desc: [
        'Your seclusion led you to a singular discovery: a forgotten truth, a hidden place, or a secret about someone powerful. Work out with your Game Master what it is; it may draw you back into the world or put you in danger.',
      ],
    },
    ...personality,
  },
  {
    index: 'village-champion',
    name: 'Village Champion',
    source: 'inkbound',
    tagline: 'You stood up once when no one else would. Now they expect it.',
    artSubject: 'A young farmhand raising a pitchfork defiantly before a burning watchtower as villagers gather behind',
    startingProficiencies: ['skill-animal-handling', 'skill-survival', 'land-vehicles'],
    proficiencyChoices: [pick(1, ARTISANS_TOOLS, 'The craft you learned at home')],
    startingEquipment: [
      { equipment: 'shovel', quantity: 1 },
      { equipment: 'pot-iron', quantity: 1 },
      { equipment: 'clothes-common', quantity: 1 },
      { equipment: 'pouch', quantity: 1 },
    ],
    startingEquipmentOptions: [{ choose: 1, type: 'equipment', desc: 'Your tools', from: { kind: 'equipmentCategory', id: 'artisans-tools' } }],
    startingGold: { quantity: 10, unit: 'gp' },
    feature: {
      name: 'Hearth and Home',
      desc: [
        'Ordinary folk see one of their own in you. Farmers, laborers and villagers will hide you, feed you and keep quiet about you, unless doing so would put their own lives at risk.',
      ],
    },
    ...personality,
  },
  {
    index: 'gutter-runner',
    name: 'Gutter Runner',
    source: 'inkbound',
    tagline: 'You grew up fast in the alleys, and you never stopped running.',
    artSubject: 'A scrappy street kid darting through a crowded market alley clutching a stolen apple, a pet rat on one shoulder',
    startingProficiencies: ['skill-sleight-of-hand', 'skill-stealth', 'disguise-kit', 'thieves-tools'],
    startingEquipment: [
      { equipment: 'dagger', quantity: 1 },
      { equipment: 'clothes-common', quantity: 1 },
      { equipment: 'pouch', quantity: 1 },
    ],
    startingEquipmentOptions: [],
    startingGold: { quantity: 10, unit: 'gp' },
    feature: {
      name: 'Back Alleys',
      desc: [
        'You know the hidden ways through a city: rooftops, cellars, drainage tunnels and short-cuts. Outside of combat, you and your companions can travel between any two places in a town twice as fast as usual.',
      ],
    },
    ...personality,
  },
  {
    index: 'guild-crafter',
    name: 'Guild Crafter',
    source: 'inkbound',
    tagline: 'A master\'s mark on your work and a guild behind your name.',
    artSubject: 'A craftsperson in a leather apron inspecting a freshly forged blade in a busy guild workshop',
    startingProficiencies: ['skill-insight', 'skill-persuasion'],
    proficiencyChoices: [pick(1, ARTISANS_TOOLS, 'Your trade')],
    languageOptions: anyLanguages(1),
    startingEquipment: [
      { equipment: 'clothes-travelers', quantity: 1 },
      { equipment: 'pouch', quantity: 1 },
    ],
    startingEquipmentOptions: [{ choose: 1, type: 'equipment', desc: 'Your tools', from: { kind: 'equipmentCategory', id: 'artisans-tools' } }],
    startingGold: { quantity: 15, unit: 'gp' },
    feature: {
      name: 'Guild Dues',
      desc: [
        'As a member in good standing, you can find lodging and a meal at any guildhall of your trade, and call on the guild for legal help or introductions to wealthy patrons, in return for your yearly dues.',
      ],
    },
    ...personality,
  },
  {
    index: 'wildlander',
    name: 'Wildlander',
    source: 'inkbound',
    tagline: 'Raised beyond the last road, where the land itself is the law.',
    artSubject: 'A wildlander in furs striding across a windswept tundra with a staff, a hunting trap slung over one shoulder',
    startingProficiencies: ['skill-athletics', 'skill-survival'],
    proficiencyChoices: [pick(1, INSTRUMENTS, 'A traveling instrument')],
    languageOptions: anyLanguages(1),
    startingEquipment: [
      { equipment: 'quarterstaff', quantity: 1 },
      { equipment: 'hunting-trap', quantity: 1 },
      { equipment: 'clothes-travelers', quantity: 1 },
      { equipment: 'pouch', quantity: 1 },
    ],
    startingEquipmentOptions: [],
    startingGold: { quantity: 10, unit: 'gp' },
    feature: {
      name: 'Trailfinder',
      desc: [
        'You never lose your way in the wild. You can always recall the lay of land you have crossed, and you can find food and fresh water for yourself and up to five companions each day, if the land has any to give.',
      ],
    },
    ...personality,
  },
  {
    index: 'swindler',
    name: 'Swindler',
    source: 'inkbound',
    tagline: 'A new name for every town, and a smile for every mark.',
    artSubject: 'A smooth-talking swindler in a feathered hat selling bottled "miracle tonics" from a cart to a gullible crowd',
    startingProficiencies: ['skill-deception', 'skill-sleight-of-hand', 'disguise-kit', 'forgery-kit'],
    startingEquipment: [
      { equipment: 'clothes-fine', quantity: 1 },
      { equipment: 'disguise-kit', quantity: 1 },
      { equipment: 'pouch', quantity: 1 },
    ],
    startingEquipmentOptions: [],
    startingGold: { quantity: 15, unit: 'gp' },
    feature: {
      name: 'Second Face',
      desc: [
        'You keep a second identity ready: a name, a history, papers and the clothes to match. You can slip into it at any time, and people who only know that persona have no reason to connect it to you.',
      ],
    },
    ...personality,
  },
];
