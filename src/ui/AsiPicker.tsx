import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ABILITIES, content, type Ability } from '@/content';
import type { Choice } from '@/rules/choices';
import { fonts, palettes, space } from '@/ui/theme';

const NAME: Record<Ability, string> = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

/**
 * Ability Score Improvement: +2 to one ability, +1 to two, or a feat.
 * Values are stored as two picks, e.g. ['str', 'str'] for +2 STR, or ['grappler'].
 */
export function AsiPicker({ choice, value, onChange, scores, color }: { choice: Choice; value: string[]; onChange: (v: string[]) => void; scores: Record<Ability, number>; color: string }) {
  const feats = choice.options.map((o) => o.id).filter((id) => content.feats.find(id));
  const isFeat = value.length === 1 && feats.includes(value[0]);
  const bump = (a: Ability) => value.filter((v) => v === a).length;

  const add = (a: Ability) => {
    if (isFeat) return onChange([a]);
    // Scores can't go above 20.
    if (scores[a] + bump(a) >= 20) return;
    if (value.length < 2) onChange([...value, a]);
  };
  const remove = (a: Ability) => {
    const i = value.lastIndexOf(a);
    if (i >= 0) onChange(value.filter((_, j) => j !== i));
  };
  const remaining = isFeat ? 0 : 2 - value.length;

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.header}>
        <Text style={styles.label}>{`Ability Score Improvement (level ${choice.level})`}</Text>
        <Text style={[styles.counter, { color: remaining ? color : palettes.dark.inkMuted }]}>{remaining ? `+${remaining} to spend` : '✓'}</Text>
      </View>
      <Text style={styles.hint}>Tap an ability to add +1 (tap twice for +2). Tap its badge to take it back.</Text>
      <View style={styles.grid}>
        {ABILITIES.map((a) => {
          const n = bump(a);
          return (
            <Pressable
              key={a}
              accessibilityRole="button"
              accessibilityLabel={`${NAME[a]} ${scores[a]}${n ? `, plus ${n}` : ''}`}
              onPress={() => add(a)}
              style={[styles.cell, n > 0 && { borderColor: color }]}>
              <Text style={styles.ability}>{NAME[a]}</Text>
              <Text style={styles.score}>{scores[a] + n}</Text>
              {n ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove plus 1 from ${NAME[a]}`} onPress={() => remove(a)} hitSlop={8} style={[styles.badge, { backgroundColor: color }]}>
                  <Text style={styles.badgeText}>{`+${n}`}</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {feats.length ? (
        <View style={{ gap: space.sm }}>
          <Text style={styles.hint}>Or take a feat instead:</Text>
          {feats.map((id) => {
            const feat = content.feats.get(id);
            const on = value[0] === id;
            return (
              <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => onChange(on ? [] : [id])} style={[styles.feat, on && { borderColor: color }]}>
                <Text style={styles.featName}>{feat.name}</Text>
                <Text style={styles.hint} numberOfLines={3}>
                  {feat.desc.join(' ')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  label: { flex: 1, fontFamily: fonts.display, fontSize: 19, color: palettes.dark.ink },
  counter: { fontFamily: fonts.bodyBold, fontSize: 13 },
  hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: palettes.dark.inkMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { width: '31.5%', minHeight: 72, borderRadius: 8, borderWidth: 1.5, borderColor: palettes.dark.rule, alignItems: 'center', justifyContent: 'center' },
  ability: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, color: palettes.dark.inkMuted },
  score: { fontFamily: fonts.display, fontSize: 26, color: palettes.dark.ink },
  badge: { position: 'absolute', top: 4, right: 4, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: palettes.dark.table },
  feat: { borderWidth: 1.5, borderColor: palettes.dark.rule, borderRadius: 8, padding: space.md, gap: 4 },
  featName: { fontFamily: fonts.bodyBold, fontSize: 15, color: palettes.dark.ink },
});
