// Display names and blurbs for any id that can appear as a choice option.
import { ABILITIES, content, type Ability } from '@/content';

const ABILITY_NAME: Record<Ability, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

const firstLine = (desc?: string | string[]) => (Array.isArray(desc) ? desc[0] : desc);

/** Strips SRD prefixes like "Skill: " and "Fighting Style: " for compact labels. */
const tidy = (name: string) =>
  name.replace(/^(Skill|Fighting Style|Circle of the Land): /, '').replace(/^Draconic Ancestry \((\w+)\)$/, '$1 Dragon');

export function describe(id: string): { name: string; blurb?: string } {
  if ((ABILITIES as string[]).includes(id)) return { name: ABILITY_NAME[id as Ability] };

  const proficiency = content.proficiencies.find(id);
  if (proficiency) {
    const skill = id.startsWith('skill-') ? content.skills.find(id.slice(6)) : undefined;
    return { name: tidy(proficiency.name), blurb: firstLine(skill?.desc) };
  }
  const spell = content.spells.find(id);
  if (spell) return { name: spell.name, blurb: spell.desc[0] };
  const item = content.equipment.find(id) ?? content.magicItems.find(id);
  if (item) return { name: item.name, blurb: firstLine(item.desc) };
  const feature = content.features.find(id);
  if (feature) return { name: tidy(feature.name), blurb: feature.desc[0] };
  const trait = content.traits.find(id);
  if (trait) return { name: tidy(trait.name), blurb: trait.desc[0] };
  const subrace = content.subraces.find(id);
  if (subrace) return { name: subrace.name, blurb: subrace.desc };
  const subclass = content.subclasses.find(id);
  if (subclass) return { name: subclass.name, blurb: subclass.desc[0] };
  const language = content.languages.find(id);
  if (language) return { name: language.name, blurb: language.typicalSpeakers.length ? `Spoken by ${language.typicalSpeakers.join(', ')}` : undefined };
  const feat = content.feats.find(id);
  if (feat) return { name: feat.name, blurb: feat.desc[0] };

  // Plain strings (favored enemies, terrains): capitalize.
  return { name: id.charAt(0).toUpperCase() + id.slice(1) };
}
