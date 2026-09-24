import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { classLevel, content, subclassLevel, type Ability } from '@/content';
import type { Character } from '@/rules/character';
import { pendingChoices, type Choice } from '@/rules/choices';
import { derive, isProficient } from '@/rules/derive';
import { roll } from '@/rules/dice';
import { levelUp } from '@/rules/play';
import { useCharacters } from '@/state/characters';
import { signedNumber } from '@/ui/AbilityMedallion';
import { AsiPicker } from '@/ui/AsiPicker';
import { ChoicePicker } from '@/ui/ChoicePicker';
import { classColors, fonts, palettes, space } from '@/ui/theme';

const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

/** Feature ids that only announce a pick (shown as the pick itself instead). */
const ANNOUNCEMENTS = /^(.*ability-score-improvement.*|.*-subclass)$/;

export default function LevelUp() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const character = useCharacters((s) => s.characters[id]);
  const save = useCharacters((s) => s.save);
  const [hp, setHp] = useState<{ mode: 'average' | 'roll'; value: number }>();
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [subclassId, setSubclassId] = useState<string>();

  const view = useMemo(() => {
    if (!character) return undefined;
    const entry = character.classes[0];
    const cls = content.classes.get(entry.classId);
    const before = derive(character);
    const newLevel = entry.level + 1;
    const average = cls.hitDie / 2 + 1;
    // The character as it will be after this level-up, with the picks so far.
    const leveled = levelUp(character, hp?.value ?? average);
    const preview: Character = {
      ...leveled,
      classes: [{ ...leveled.classes[0], subclassId: subclassId ?? leveled.classes[0].subclassId }],
      choices: { ...leveled.choices, ...choices },
    };
    const after = derive(preview);
    const sub = preview.classes[0].subclassId;
    const featureIds = [...classLevel(cls.index, newLevel).features, ...(sub ? subclassLevel(sub, newLevel)?.features ?? [] : [])];
    const features = featureIds
      .filter((f) => !ANNOUNCEMENTS.test(f))
      .map((f) => content.features.find(f))
      .filter((f): f is NonNullable<typeof f> => Boolean(f));
    const pending = pendingChoices(preview);
    // Every choice that belongs to this level (answered or not), plus any older ones still open.
    const levelChoices = [
      ...new Map(
        [...pendingChoices({ ...preview, choices: leveled.choices, classes: leveled.classes }), ...pending]
          .filter((c) => c.level === newLevel || pending.some((p) => p.id === c.id))
          .map((c) => [c.id, c]),
      ).values(),
    ];
    return { cls, before, after, newLevel, average, preview, features, pending, levelChoices };
  }, [character, hp, choices, subclassId]);

  if (!character || !view) return <View style={styles.screen} />;
  const { cls, before, after, newLevel, average, preview, features, pending, levelChoices } = view;
  const color = classColors[cls.index];
  const hpGain = after.maxHp - before.maxHp;

  const rollHp = () => {
    const r = roll(`1d${cls.hitDie}`, { label: 'Hit points' });
    setHp({ mode: 'roll', value: r.total });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const values: Record<string, string[]> = { ...preview.choices, subclass: preview.classes[0].subclassId ? [preview.classes[0].subclassId] : [] };
  const onChange = (choiceId: string, v: string[]) => {
    if (choiceId === 'subclass') setSubclassId(v[0]);
    else setChoices((c) => ({ ...c, [choiceId]: v }));
  };
  const picked = new Set(Object.values(preview.choices).flat());
  const locked = new Set([...after.proficiencies].filter((p) => p.startsWith('skill-') && !picked.has(p)));

  const confirm = () => {
    save(preview);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const newSlots = (after.spellcasting?.slots ?? []).map((n, i) => n - (before.spellcasting?.slots[i] ?? 0)).map((d, i) => (d > 0 ? `+${d} ${ORDINAL[i + 1]}` : null)).filter(Boolean);
  const pactChange =
    after.spellcasting?.pactSlots && JSON.stringify(after.spellcasting.pactSlots) !== JSON.stringify(before.spellcasting?.pactSlots)
      ? `Pact slots: ${after.spellcasting.pactSlots.count} × ${ORDINAL[after.spellcasting.pactSlots.level]} level`
      : null;
  const changes = [
    after.profBonus !== before.profBonus ? `Proficiency bonus ${signedNumber(after.profBonus)}` : null,
    newSlots.length ? `Spell slots: ${newSlots.join(', ')}` : null,
    pactChange,
    ...after.resources
      .filter((r) => r.max !== before.resources.find((b) => b.id === r.id)?.max)
      .map((r) => `${r.name}: ${r.max >= 9999 ? 'unlimited' : r.max}`),
    after.sneakAttack && after.sneakAttack !== before.sneakAttack ? `Sneak Attack ${after.sneakAttack}` : null,
    after.attacksPerAction > before.attacksPerAction ? `${after.attacksPerAction} attacks per Attack action` : null,
  ].filter(Boolean) as string[];

  const renderChoice = (choice: Choice) =>
    choice.id.startsWith('asi:') ? (
      <AsiPicker
        key={choice.id}
        choice={choice}
        value={preview.choices[choice.id] ?? []}
        onChange={(v) => onChange(choice.id, v)}
        // Scores before this ASI, so the picker can cap them at 20.
        scores={Object.fromEntries(Object.entries(derive({ ...preview, choices: { ...preview.choices, [choice.id]: [] } }).abilities).map(([a, l]) => [a, l.score])) as Record<Ability, number>}
        color={color}
      />
    ) : (
      <ChoicePicker key={choice.id} choice={choice} choices={values} onChange={onChange} color={color} locked={locked} isProficient={(i) => isProficient(after.proficiencies, i)} />
    );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: `${character.name}: level ${newLevel}` }} />
      <View style={[styles.hero, { borderColor: color }]}>
        <Text style={styles.heroLevel}>{`${cls.name} ${newLevel - 1} → ${newLevel}`}</Text>
        <Text style={styles.small}>{`Hit points ${before.maxHp} → ${after.maxHp}${hp ? '' : ' (with average HP)'}`}</Text>
      </View>

      <Section title="Hit points">
        <Text style={styles.small}>{`Roll your hit die (d${cls.hitDie}) or take the average (${average}). Your Constitution modifier is added either way. A roll is final.`}</Text>
        <View style={styles.row}>
          <HpOption active={hp?.mode === 'roll'} locked={hp?.mode === 'roll'} color={color} label={hp?.mode === 'roll' ? `Rolled ${hp.value}` : `Roll d${cls.hitDie}`} onPress={rollHp} />
          <HpOption active={hp?.mode === 'average'} locked={hp?.mode === 'roll'} color={color} label={`Take ${average}`} onPress={() => setHp({ mode: 'average', value: average })} />
        </View>
        {hp ? <Text style={[styles.gain, { color }]}>{`+${hpGain} max HP`}</Text> : null}
      </Section>

      {features.length ? (
        <Section title="New features">
          {features.map((f) => (
            <View key={f.index} style={[styles.feature, { borderLeftColor: color }]}>
              <Text style={styles.featureName}>{f.name}</Text>
              <Text style={styles.small} numberOfLines={6}>
                {f.desc.join(' ')}
              </Text>
            </View>
          ))}
        </Section>
      ) : null}

      {changes.length ? (
        <Section title="Also improves">
          {changes.map((c) => (
            <Text key={c} style={styles.change}>{`• ${c}`}</Text>
          ))}
        </Section>
      ) : null}

      {levelChoices.map((choice) => (
        <View key={choice.id} style={styles.choiceBlock}>
          {renderChoice(choice)}
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        disabled={!hp || pending.length > 0}
        onPress={confirm}
        style={({ pressed }) => [styles.confirm, { backgroundColor: color, opacity: !hp || pending.length ? 0.35 : pressed ? 0.8 : 1 }]}>
        <Text style={styles.confirmText}>{`Become level ${newLevel}`}</Text>
      </Pressable>
      {!hp || pending.length ? (
        <Text style={[styles.small, { textAlign: 'center' }]}>
          {!hp ? 'Choose how to gain hit points first.' : `Still to choose: ${pending.map((p) => p.label).join(', ')}`}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** Once the hit die is rolled, the result stands: both options lock. */
function HpOption({ active, locked, color, label, onPress }: { active?: boolean; locked?: boolean; color: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: Boolean(active), disabled: Boolean(locked) }}
      disabled={locked}
      onPress={onPress}
      style={[styles.choice, { borderColor: active ? color : palettes.dark.rule, opacity: locked && !active ? 0.4 : 1 }, active && { backgroundColor: color }]}>
      <Text style={[styles.choiceText, { color: active ? palettes.dark.table : palettes.dark.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palettes.dark.table },
  body: { padding: space.lg, paddingBottom: 64, gap: space.xl, maxWidth: 680, width: '100%', alignSelf: 'center' },
  hero: { borderWidth: 1.5, borderRadius: 10, padding: space.lg, gap: 4, alignItems: 'center' },
  heroLevel: { fontFamily: fonts.display, fontSize: 30, color: palettes.dark.ink },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: palettes.dark.inkMuted },
  sectionTitle: { fontFamily: fonts.display, fontSize: 21, color: palettes.dark.ink },
  row: { flexDirection: 'row', gap: space.sm },
  choice: { flex: 1, minHeight: 52, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontFamily: fonts.bodyBold, fontSize: 16 },
  gain: { fontFamily: fonts.display, fontSize: 24, textAlign: 'center' },
  feature: { borderLeftWidth: 3, paddingLeft: space.md, gap: 4, paddingVertical: 2 },
  featureName: { fontFamily: fonts.bodyBold, fontSize: 16, color: palettes.dark.ink },
  change: { fontFamily: fonts.body, fontSize: 15, color: palettes.dark.ink },
  choiceBlock: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palettes.dark.rule, paddingTop: space.lg },
  confirm: { minHeight: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontFamily: fonts.bodyBold, fontSize: 18, color: palettes.dark.table },
});
