import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ABILITIES, content } from '@/content';
import { d20Plus } from '@/rules/dice';
import { currentHp, deathSave, longRest, setExhaustion, shortRest, toggleCondition } from '@/rules/play';
import { Button, Section, StatBox, TabBody } from '@/sheet/parts';
import { useRolls } from '@/sheet/rolls';
import { useSheet } from '@/sheet/useSheet';
import { AbilityMedallion, signedNumber } from '@/ui/AbilityMedallion';
import { Pips } from '@/ui/Pips';
import { fonts, palettes, space } from '@/ui/theme';

const EXHAUSTION = ['None', 'Disadvantage on ability checks', 'Speed halved', 'Disadvantage on attacks and saves', 'HP maximum halved', 'Speed 0', 'Death'];

export default function Overview() {
  const s = useSheet()!;
  const roll = useRolls((r) => r.roll);
  const { character, sheet, color, update } = s;
  const [restOpen, setRestOpen] = useState(false);
  const [info, setInfo] = useState<string>();
  const down = currentHp(character, sheet) === 0;

  const rollDeathSave = () => {
    const result = roll('1d20', 'Death saving throw', { mode: 'normal' });
    update((c) => deathSave(c, result.total).character);
  };

  return (
    <TabBody>
      {down ? (
        <Section title="Death saves">
          <View style={[styles.deathBox, { borderColor: '#C23B3B' }]}>
            <View style={styles.deathRow}>
              <Text style={styles.deathLabel}>Successes</Text>
              <Pips max={3} spent={3 - character.play.deathSaves.successes} color="#6DAA45" label="Death save successes" summary={`${character.play.deathSaves.successes} of 3 successes`} />
            </View>
            <View style={styles.deathRow}>
              <Text style={styles.deathLabel}>Failures</Text>
              <Pips max={3} spent={3 - character.play.deathSaves.failures} color="#C23B3B" label="Death save failures" summary={`${character.play.deathSaves.failures} of 3 failures`} />
            </View>
            <Text style={styles.small}>
              {character.play.deathSaves.failures >= 3
                ? 'Three failures: your character has died.'
                : character.play.deathSaves.successes >= 3
                  ? 'Three successes: you are stable at 0 HP.'
                  : 'Roll a d20 each turn: 10 or higher succeeds, a 1 counts twice, a 20 brings you back with 1 HP.'}
            </Text>
            <Button label="Roll death save" color="#C23B3B" kind="solid" onPress={rollDeathSave} />
          </View>
        </Section>
      ) : null}

      <Section title="Abilities" right={<Text style={styles.small}>Tap to roll a check</Text>}>
        <View style={styles.abilities}>
          {ABILITIES.map((a) => {
            const line = sheet.abilities[a];
            return (
              <View key={a} style={styles.abilityCell}>
                <Pressable accessibilityRole="button" accessibilityHint="Rolls an ability check" onPress={() => roll(d20Plus(line.mod), `${a.toUpperCase()} check`)}>
                  <AbilityMedallion ability={a} score={line.score} color={color} size={80} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${a.toUpperCase()} saving throw ${signedNumber(line.save)}${line.saveProficient ? ', proficient' : ''}. Tap to roll.`}
                  onPress={() => roll(d20Plus(line.save), `${a.toUpperCase()} save`)}
                  style={[styles.save, line.saveProficient && { borderColor: color }]}>
                  <Text style={styles.saveText}>{`Save ${signedNumber(line.save)}`}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </Section>

      <View style={styles.statRow}>
        <StatBox label="Prof" value={signedNumber(sheet.profBonus)} />
        <StatBox label="Passive Perc." value={sheet.passivePerception} />
        <StatBox label="Initiative" value={signedNumber(sheet.initiative)} onPress={() => roll(d20Plus(sheet.initiative), 'Initiative')} />
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: character.play.inspiration }}
          accessibilityLabel="Inspiration"
          onPress={() => update((c) => ({ ...c, play: { ...c.play, inspiration: !c.play.inspiration } }))}
          style={[styles.inspiration, character.play.inspiration && { backgroundColor: color, borderColor: color }]}>
          <Text style={[styles.inspirationStar, { color: character.play.inspiration ? palettes.dark.table : palettes.dark.inkMuted }]}>★</Text>
          <Text style={[styles.inspirationLabel, { color: character.play.inspiration ? palettes.dark.table : palettes.dark.inkMuted }]}>INSPIRED</Text>
        </Pressable>
      </View>

      <Section title="Conditions">
        <View style={styles.chips}>
          {content.conditions.all
            .filter((c) => c.index !== 'exhaustion')
            .map((cond) => {
              const on = character.play.conditions.includes(cond.index);
              return (
                <Pressable
                  key={cond.index}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: on }}
                  onPress={() => update((c) => toggleCondition(c, cond.index))}
                  onLongPress={() => setInfo(cond.index)}
                  style={[styles.chip, on && { backgroundColor: '#8E2F2F', borderColor: '#C23B3B' }]}>
                  <Text style={[styles.chipText, on && { color: palettes.dark.ink }]}>{cond.name}</Text>
                </Pressable>
              );
            })}
        </View>
        {character.play.conditions.map((id) => {
          const cond = content.conditions.get(id);
          return (
            <View key={id} style={styles.conditionInfo}>
              <Text style={styles.conditionName}>{cond.name}</Text>
              {cond.desc.map((d) => (
                <Text key={d} style={styles.small}>
                  {d}
                </Text>
              ))}
            </View>
          );
        })}
        {character.play.conditions.length === 0 ? <Text style={styles.small}>Tap to apply. Active conditions show their rules here. Long-press for details.</Text> : null}
      </Section>

      <Section title="Exhaustion">
        <View style={styles.exhaustion}>
          <Button label="−" color={palettes.dark.rule} a11y="Remove a level of exhaustion" onPress={() => update((c) => setExhaustion(c, c.play.exhaustion - 1))} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.exhaustionLevel}>{character.play.exhaustion}</Text>
            <Text style={styles.small}>{EXHAUSTION[character.play.exhaustion]}</Text>
          </View>
          <Button label="+" color={palettes.dark.rule} a11y="Add a level of exhaustion" onPress={() => update((c) => setExhaustion(c, c.play.exhaustion + 1))} />
        </View>
      </Section>

      <Section title="Rest">
        <View style={styles.restRow}>
          <View style={{ flex: 1 }}>
            <Button label="Short rest" color={color} onPress={() => setRestOpen(true)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Long rest" color={color} kind="solid" onPress={() => update(longRest)} a11y="Long rest: restores HP, spell slots and abilities" />
          </View>
        </View>
        <Text style={styles.small}>{`Hit dice: ${sheet.level - character.play.hitDiceSpent} of ${sheet.level} d${sheet.hitDie} left`}</Text>
      </Section>

      <ShortRest visible={restOpen} onClose={() => setRestOpen(false)} />
      <ConditionInfo id={info} onClose={() => setInfo(undefined)} />
    </TabBody>
  );
}

/** Spend hit dice one at a time; each heals its roll + CON. Finishing resets short-rest abilities. */
function ShortRest({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const s = useSheet()!;
  const roll = useRolls((r) => r.roll);
  const [rolls, setRolls] = useState<number[]>([]);
  const { character, sheet, color, update } = s;
  const left = sheet.level - character.play.hitDiceSpent - rolls.length;
  const con = sheet.abilities.con.mod;
  const healed = rolls.reduce((n, r) => n + Math.max(0, r + con), 0);

  const finish = () => {
    update((c) => shortRest(c, rolls));
    setRolls([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalWrap}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Short rest</Text>
          <Text style={styles.small}>{`Spend hit dice to heal. Each one heals d${sheet.hitDie} ${signedNumber(con)}.`}</Text>
          <Text style={styles.modalBig}>{`+${healed} HP`}</Text>
          <Text style={styles.small}>{rolls.length ? `Rolled: ${rolls.join(', ')}` : `${left} hit dice available`}</Text>
          <Button
            label={`Roll a hit die (${left} left)`}
            color={color}
            disabled={left <= 0}
            onPress={() => {
              const r = roll(`1d${sheet.hitDie}`, 'Hit die');
              setRolls((x) => [...x, r.total]);
            }}
          />
          <Button label="Finish short rest" color={color} kind="solid" onPress={finish} />
          <Button label="Cancel" color={palettes.dark.inkMuted} onPress={() => { setRolls([]); onClose(); }} />
        </View>
      </View>
    </Modal>
  );
}

function ConditionInfo({ id, onClose }: { id?: string; onClose: () => void }) {
  const cond = id ? content.conditions.find(id) : undefined;
  return (
    <Modal visible={Boolean(cond)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalWrap} onPress={onClose}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{cond?.name}</Text>
          {cond?.desc.map((d) => (
            <Text key={d} style={styles.small}>
              {d}
            </Text>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: palettes.dark.inkMuted },
  abilities: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.lg },
  abilityCell: { width: '31%', alignItems: 'center', gap: space.md },
  save: { borderWidth: 1, borderColor: palettes.dark.rule, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, minHeight: 32, justifyContent: 'center' },
  saveText: { fontFamily: fonts.bodyBold, fontSize: 12, color: palettes.dark.ink },
  statRow: { flexDirection: 'row', gap: space.sm },
  inspiration: { flex: 1, minWidth: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: palettes.dark.rule },
  inspirationStar: { fontSize: 20 },
  inspirationLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderWidth: 1, borderColor: palettes.dark.rule, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, minHeight: 34, justifyContent: 'center' },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: palettes.dark.inkMuted },
  conditionInfo: { borderLeftWidth: 2, borderLeftColor: '#C23B3B', paddingLeft: space.md, gap: 4 },
  conditionName: { fontFamily: fonts.bodyBold, color: palettes.dark.ink },
  exhaustion: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  exhaustionLevel: { fontFamily: fonts.display, fontSize: 28, color: palettes.dark.ink },
  restRow: { flexDirection: 'row', gap: space.sm },
  deathBox: { borderWidth: 1.5, borderRadius: 8, padding: space.md, gap: space.md },
  deathRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  deathLabel: { width: 84, fontFamily: fonts.bodyBold, color: palettes.dark.ink },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  modal: { width: '100%', maxWidth: 420, backgroundColor: '#1B1612', borderRadius: 12, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: palettes.dark.rule },
  modalTitle: { fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink },
  modalBig: { fontFamily: fonts.display, fontSize: 36, color: palettes.dark.ink, textAlign: 'center' },
});
