// Limited-use resources. The SRD JSON describes these in prose only, so their
// maximums and reset rules are written out here, keyed off SRD feature/trait ids.
import type { Ability, Level } from '@/content';

export type Resource = { id: string; name: string; max: number; reset: 'short' | 'long' };

export type ResourceContext = {
  classId: string;
  level: number;
  features: Set<string>;
  traits: Set<string>;
  mods: Record<Ability, number>;
  classSpecific: Level['classSpecific'];
};

const num = (v: unknown) => (typeof v === 'number' ? v : 0);

export function resourcesFor(ctx: ResourceContext): Resource[] {
  const { features: f, traits: t, mods, level } = ctx;
  const cs = ctx.classSpecific ?? {};
  const out: Resource[] = [];
  const add = (id: string, name: string, max: number, reset: Resource['reset']) => {
    if (max > 0) out.push({ id, name, max, reset });
  };

  // Barbarian (a 9999 count at level 20 means unlimited; shown as such by the UI)
  if (f.has('rage')) add('rage', 'Rage', num(cs.rageCount), 'long');
  // Bard
  if (f.has('bardic-inspiration-d6')) {
    add('bardic-inspiration', 'Bardic Inspiration', Math.max(1, mods.cha), f.has('font-of-inspiration') ? 'short' : 'long');
  }
  // Cleric and Paladin
  if (f.has('channel-divinity-1-rest')) add('channel-divinity', 'Channel Divinity', num(cs.channelDivinityCharges), 'short');
  if (f.has('channel-divinity') && ctx.classId === 'paladin') add('channel-divinity', 'Channel Divinity', 1, 'short');
  if (f.has('divine-sense')) add('divine-sense', 'Divine Sense', 1 + mods.cha, 'long');
  if (f.has('lay-on-hands')) add('lay-on-hands', 'Lay on Hands (HP pool)', 5 * level, 'long');
  // Druid
  if ([...f].some((id) => id.startsWith('wild-shape'))) add('wild-shape', 'Wild Shape', level >= 20 ? 9999 : 2, 'short');
  // Fighter
  if (f.has('second-wind')) add('second-wind', 'Second Wind', 1, 'short');
  add('action-surge', 'Action Surge', num(cs.actionSurges), 'short');
  add('indomitable', 'Indomitable', num(cs.indomitableUses), 'long');
  // Monk
  if (f.has('ki')) add('ki', 'Ki', num(cs.kiPoints), 'short');
  // Sorcerer
  if (f.has('font-of-magic')) add('sorcery-points', 'Sorcery Points', num(cs.sorceryPoints), 'long');
  // Wizard
  if (f.has('arcane-recovery')) add('arcane-recovery', 'Arcane Recovery', 1, 'long');
  // Racial
  if (t.has('breath-weapon')) add('breath-weapon', 'Breath Weapon', 1, 'short');
  if (t.has('relentless-endurance')) add('relentless-endurance', 'Relentless Endurance', 1, 'long');

  return out;
}
