import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { content, type Spell } from '@/content';
import { schoolMeta } from '@/content/meta/races';
import { d20Plus } from '@/rules/dice';
import { setConcentration, spendSlot, togglePrepared } from '@/rules/play';
import { spellAccess } from '@/rules/spells';
import { Button, Section, StatBox, TabBody } from '@/sheet/parts';
import { useRolls } from '@/sheet/rolls';
import { useSheet } from '@/sheet/useSheet';
import { signedNumber } from '@/ui/AbilityMedallion';
import { Pips } from '@/ui/Pips';
import { fonts, palettes, space } from '@/ui/theme';

const ORDINAL = ['Cantrips', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

export default function Spells() {
  const { character, sheet, color, update } = useSheet()!;
  const roll = useRolls((r) => r.roll);
  const [casting, setCasting] = useState<Spell>();
  const [open, setOpen] = useState<string>();
  const sc = sheet.spellcasting!;
  const access = spellAccess(character, sheet)!;
  const prepared = new Set(character.play.preparedSpells);
  const always = new Set(access.alwaysPrepared);
  const preparedCount = access.spells.filter((id) => prepared.has(id) && !always.has(id)).length;

  // Spells shown: cantrips, then leveled spells (all for known casters; prepared-first for preparers).
  const leveled = [...new Set([...access.alwaysPrepared, ...access.spells])].map((id) => content.spells.get(id));
  const byLevel = new Map<number, Spell[]>();
  for (const spell of leveled) byLevel.set(spell.level, [...(byLevel.get(spell.level) ?? []), spell]);
  const cantrips = access.cantrips.map((id) => content.spells.get(id));

  const castable = (spell: Spell) => spell.level === 0 || !access.prepares || prepared.has(spell.index) || always.has(spell.index);

  const cast = (spell: Spell, slotLevel: number) => {
    update((c) => {
      let next = spell.level > 0 ? spendSlot(c, slotLevel) : c;
      if (spell.concentration) next = setConcentration(next, spell.index);
      return next;
    });
    setCasting(undefined);
  };

  const concentration = character.play.concentration ? content.spells.find(character.play.concentration) : undefined;

  return (
    <TabBody>
      {concentration ? (
        <View style={[styles.banner, { borderColor: color }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerLabel}>CONCENTRATING</Text>
            <Text style={styles.bannerSpell}>{concentration.name}</Text>
          </View>
          <Button label="End" color={color} onPress={() => update((c) => setConcentration(c, undefined))} />
        </View>
      ) : null}

      <View style={styles.statRow}>
        <StatBox label="Save DC" value={sc.saveDc} />
        <StatBox label="Spell attack" value={signedNumber(sc.attackBonus)} onPress={() => roll(d20Plus(sc.attackBonus), 'Spell attack')} />
        <StatBox label="Ability" value={sc.ability.toUpperCase()} />
        {access.prepares ? <StatBox label="Prepared" value={`${preparedCount}/${sc.preparedMax}`} /> : null}
      </View>

      <Section title="Spell slots">
        {sc.pactSlots ? (
          <SlotRow label={`Pact (${ORDINAL[sc.pactSlots.level]})`} max={sc.pactSlots.count} spent={character.play.pactSlotsSpent} color={color}
            onChange={(n) => update((c) => ({ ...c, play: { ...c.play, pactSlotsSpent: Math.max(0, Math.min(sc.pactSlots!.count, n)) } }))} />
        ) : null}
        {sc.slots.map((max, i) =>
          max > 0 ? (
            <SlotRow key={i} label={ORDINAL[i + 1]} max={max} spent={character.play.slotsSpent[i]} color={color}
              onChange={(n) => update((c) => {
                const slotsSpent = [...c.play.slotsSpent];
                slotsSpent[i] = Math.max(0, Math.min(max, n));
                return { ...c, play: { ...c.play, slotsSpent } };
              })} />
          ) : null,
        )}
        <Text style={styles.small}>Tap a filled diamond to spend a slot, a hollow one to get it back. Long rests restore all slots.</Text>
      </Section>

      {[[0, cantrips] as const, ...[...byLevel.entries()].sort((a, b) => a[0] - b[0])].map(([level, spells]) =>
        spells.length ? (
          <Section key={level} title={level === 0 ? 'Cantrips' : `${ORDINAL[level]} level`}>
            {spells.map((spell) => {
              const isAlways = always.has(spell.index);
              const isPrepared = prepared.has(spell.index) || isAlways;
              const expanded = open === spell.index;
              return (
                <View key={spell.index} style={styles.spell}>
                  <View style={[styles.stripe, { backgroundColor: schoolMeta[spell.school]?.color ?? color }]} />
                  <Pressable style={{ flex: 1 }} onPress={() => setOpen(expanded ? undefined : spell.index)} accessibilityRole="button" accessibilityHint="Shows the spell description">
                    <Text style={styles.spellName}>{spell.name}</Text>
                    <Text style={styles.small}>
                      {[spell.castingTime, spell.range, spell.duration, spell.concentration ? 'Concentration' : null, spell.ritual ? 'Ritual' : null, isAlways ? 'Always prepared' : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    {expanded ? spell.desc.concat(spell.higherLevel).map((d) => <Text key={d} style={styles.desc}>{d}</Text>) : null}
                  </Pressable>
                  <View style={styles.spellActions}>
                    {access.prepares && spell.level > 0 && !isAlways ? (
                      <Pressable
                        accessibilityRole="switch"
                        accessibilityState={{ checked: isPrepared }}
                        accessibilityLabel={`Prepare ${spell.name}`}
                        disabled={!isPrepared && preparedCount >= (sc.preparedMax ?? 0)}
                        onPress={() => update((c) => togglePrepared(c, spell.index))}
                        style={[styles.prep, isPrepared && { backgroundColor: color, borderColor: color }, !isPrepared && preparedCount >= (sc.preparedMax ?? 0) && { opacity: 0.35 }]}>
                        <Text style={[styles.prepText, isPrepared && { color: palettes.dark.table }]}>{isPrepared ? 'Prepared' : 'Prepare'}</Text>
                      </Pressable>
                    ) : null}
                    {castable(spell) ? (
                      <Pressable accessibilityRole="button" accessibilityLabel={`Cast ${spell.name}`} onPress={() => (spell.level === 0 ? cast(spell, 0) : setCasting(spell))} style={[styles.cast, { borderColor: color }]}>
                        <Text style={[styles.castText, { color }]}>Cast</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Section>
        ) : null,
      )}

      <CastModal spell={casting} onClose={() => setCasting(undefined)} onCast={cast} />
    </TabBody>
  );
}

function SlotRow({ label, max, spent, color, onChange }: { label: string; max: number; spent: number; color: string; onChange: (spent: number) => void }) {
  return (
    <View style={styles.slotRow}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Pips max={max} spent={spent} color={color} label={`${label} level slots`} onChange={onChange} />
    </View>
  );
}

/** Choose which slot to spend (upcasting), then cast. */
function CastModal({ spell, onClose, onCast }: { spell?: Spell; onClose: () => void; onCast: (spell: Spell, level: number) => void }) {
  const { character, sheet, color } = useSheet()!;
  const sc = sheet.spellcasting!;
  if (!spell) return null;
  const options = sc.pactSlots
    ? [{ level: sc.pactSlots.level, left: sc.pactSlots.count - character.play.pactSlotsSpent }]
    : sc.slots.map((max, i) => ({ level: i + 1, left: max - character.play.slotsSpent[i] })).filter((o) => o.level >= spell.level && o.left + (character.play.slotsSpent[o.level - 1] ?? 0) > 0);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalWrap} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => undefined}>
          <Text style={styles.modalTitle}>{`Cast ${spell.name}`}</Text>
          <Text style={styles.small}>{spell.higherLevel[0] ?? 'Choose a spell slot to spend.'}</Text>
          {options.map((o) => (
            <Button key={o.level} label={`${ORDINAL[o.level]}-level slot (${o.left} left)`} color={color} disabled={o.left <= 0} onPress={() => onCast(spell, o.level)} />
          ))}
          {spell.ritual ? <Button label="Cast as a ritual (no slot, +10 minutes)" color={palettes.dark.inkMuted} onPress={onClose} /> : null}
          <Button label="Cancel" color={palettes.dark.inkMuted} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: palettes.dark.inkMuted },
  desc: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: palettes.dark.ink, marginTop: space.sm },
  statRow: { flexDirection: 'row', gap: space.sm },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1.5, borderRadius: 8, padding: space.md },
  bannerLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.3, color: palettes.dark.inkMuted },
  bannerSpell: { fontFamily: fonts.display, fontSize: 20, color: palettes.dark.ink },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 40 },
  slotLabel: { width: 84, fontFamily: fonts.bodyBold, color: palettes.dark.ink },
  spell: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule },
  stripe: { width: 4, borderRadius: 2 },
  spellName: { fontFamily: fonts.bodyBold, fontSize: 16, color: palettes.dark.ink },
  spellActions: { gap: space.sm, justifyContent: 'center' },
  prep: { borderWidth: 1, borderColor: palettes.dark.rule, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' },
  prepText: { fontFamily: fonts.bodyBold, fontSize: 12, color: palettes.dark.inkMuted },
  cast: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, alignItems: 'center', minHeight: 32, justifyContent: 'center' },
  castText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  modal: { width: '100%', maxWidth: 420, backgroundColor: '#1B1612', borderRadius: 12, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: palettes.dark.rule },
  modalTitle: { fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink },
});
