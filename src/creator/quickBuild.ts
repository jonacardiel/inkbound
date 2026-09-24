// Quick Build: fills every open pick in a draft with a sensible default, so a
// new player can go straight from race + class to a playable character.
import { ABILITIES, content, type Ability } from '@/content';
import { classMeta } from '@/content/meta/classes';
import { pendingChoices, type Choice } from '@/rules/choices';
import { isProficient, derive } from '@/rules/derive';
import { withStartingGear } from '@/rules/creation';
import { draftToCharacter, type Draft } from '@/state/draft';

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

/** Beginner-friendly spell picks per class, preferred by Quick Build (others fill any gaps). */
const RECOMMENDED_SPELLS: Record<string, string[]> = {
  bard: ['vicious-mockery', 'minor-illusion', 'healing-word', 'sleep', 'charm-person', 'faerie-fire'],
  cleric: ['sacred-flame', 'guidance', 'spare-the-dying', 'thaumaturgy'],
  druid: ['produce-flame', 'guidance', 'shillelagh', 'cure-wounds', 'entangle', 'healing-word'],
  ranger: ['hunters-mark', 'cure-wounds', 'goodberry'],
  sorcerer: ['fire-bolt', 'ray-of-frost', 'light', 'mage-hand', 'magic-missile', 'shield', 'sleep'],
  warlock: ['eldritch-blast', 'minor-illusion', 'hellish-rebuke', 'charm-person'],
  wizard: ['fire-bolt', 'mage-hand', 'light', 'ray-of-frost', 'magic-missile', 'shield', 'mage-armor', 'sleep', 'detect-magic', 'burning-hands', 'thunderwave'],
};

/** Abilities in priority order for the draft's class (its Quick Build order). */
const priority = (d: Draft): Ability[] => (d.classId ? classMeta[d.classId].quickBuildOrder : ABILITIES);

function scoreOf(id: string, order: Ability[], classId?: string): number {
  // Spells: recommended ones first, in list order.
  if (content.spells.find(id)) {
    const rank = (classId ? RECOMMENDED_SPELLS[classId] ?? [] : []).indexOf(id);
    return rank >= 0 ? rank : 100;
  }
  // Skills: prefer those keyed to the class's best abilities.
  const skill = id.startsWith('skill-') ? content.skills.find(id.slice(6)) : undefined;
  if (skill) return order.indexOf(skill.abilityScore);
  // Ability bonuses (Half-Elf): same priority.
  const a = order.indexOf(id as Ability);
  return a >= 0 ? a : 99;
}

function fill(d: Draft, choice: Choice): Draft {
  const character = draftToCharacter(d, 'draft', true)!;
  const known = new Set([...content.races.get(d.race!).languages]);
  const sheet = d.classId ? derive(withStartingGear(character)) : undefined;
  const taken = new Set(d.choices[choice.id] ?? []);
  const order = priority(d);

  if (choice.id === 'subrace') return { ...d, subrace: choice.options[0].id };
  if (choice.id === 'subclass') return { ...d, subclassId: choice.options[0].id };

  // Equipment bundles: the first option you're proficient for, plus its sub-picks.
  if (choice.options.some((o) => o.items || o.subChoices)) {
    const option =
      choice.options.find((o) => !o.requires || o.requires.every((r) => sheet && isProficient(sheet.proficiencies, r))) ??
      choice.options[0];
    const choices = { ...d.choices, [choice.id]: [option.id] };
    for (const sub of option.subChoices ?? []) {
      // Prefer weapons the character is proficient with.
      const ids = sub.options.map((o) => o.id);
      const usable = ids.filter((id) => !sheet || isProficient(sheet.proficiencies, id));
      choices[sub.id] = (usable.length >= sub.count ? usable : ids).slice(0, sub.count);
    }
    return { ...d, choices };
  }

  const candidates = choice.options
    .map((o) => o.id)
    .filter((id) => !taken.has(id) && !known.has(id) && !(sheet?.proficiencies.has(id) && id.startsWith('skill-')))
    // Never spend an ASI-style pick on a feat by default.
    .filter((id) => !content.feats.find(id))
    .sort((x, y) => scoreOf(x, order, d.classId) - scoreOf(y, order, d.classId));
  const picks = [...taken, ...candidates].slice(0, choice.count);
  return { ...d, choices: { ...d.choices, [choice.id]: picks } };
}

export function quickBuild(draft: Draft): Draft {
  let d = draft;
  if (Object.keys(d.baseScores).length < 6 && d.abilityMethod !== 'pointBuy') {
    d = {
      ...d,
      abilityMethod: 'standard',
      baseScores: Object.fromEntries(priority(d).map((a, i) => [a, STANDARD_ARRAY[i]])),
    };
  }
  // Picks can unlock further picks (e.g. a subclass), so repeat until settled.
  for (let pass = 0; pass < 6; pass++) {
    const character = draftToCharacter(d, 'draft', true);
    if (!character) return d;
    const pending = pendingChoices(character, { includeEquipment: true });
    if (!pending.length) break;
    for (const choice of pending) d = fill(d, choice);
  }
  return d;
}
