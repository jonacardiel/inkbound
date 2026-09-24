import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Mode } from '@/rules/dice';
import { useDiceSettings, useRolls, type DiceAnimation } from '@/sheet/rolls';
import { D20Icon } from '@/ui/D20Icon';
import { fonts, palettes, space } from '@/ui/theme';

const DICE = [4, 6, 8, 10, 12, 20, 100];
/** Most dice the 3D stage lays out legibly at once. */
const MAX_POOL = 8;
/** Pause so the tray finishes closing before the throw starts. */
const CLOSE_MS = 250;

type Pool = Record<number, number>;

/** "2d6 + 1d8 + 2": largest dice first, then the modifier. */
function poolExpression(pool: Pool, modifier: number): string {
  const dice = [...DICE]
    .sort((a, b) => b - a)
    .filter((sides) => pool[sides])
    .map((sides) => `${pool[sides]}d${sides}`);
  if (!dice.length) return '';
  const mod = modifier ? ` ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}` : '';
  return dice.join(' + ') + mod;
}
const ANIMATIONS: { id: DiceAnimation; label: string }[] = [
  { id: 'full', label: '3D dice' },
  { id: 'quick', label: 'Quick' },
  { id: 'off', label: 'Off' },
];

const MODES: { id: Mode; label: string }[] = [
  { id: 'disadvantage', label: 'Disadv.' },
  { id: 'normal', label: 'Normal' },
  { id: 'advantage', label: 'Advantage' },
];

/**
 * Floating dice button and the tray it opens: build a pool of dice (plus a
 * modifier), then Roll. The tray closes so the 3D throw plays unobstructed.
 */
export function DiceTray({ color }: { color: string }) {
  const [open, setOpen] = useState(false);
  const [pool, setPool] = useState<Pool>({});
  const [modifier, setModifier] = useState(0);
  const poolSize = Object.values(pool).reduce((a, b) => a + b, 0);
  const expression = poolExpression(pool, modifier);
  const { roll, mode, setMode, log, forceNextD20, setForceNextD20 } = useRolls();
  const { animation, setAnimation } = useDiceSettings();
  const insets = useSafeAreaInsets();

  const addDie = (sides: number) => {
    if (poolSize < MAX_POOL) setPool((p) => ({ ...p, [sides]: (p[sides] ?? 0) + 1 }));
  };
  const removeDie = (sides: number) => setPool((p) => ({ ...p, [sides]: Math.max(0, (p[sides] ?? 0) - 1) }));
  const rollPool = () => {
    if (!expression) return;
    setOpen(false);
    setTimeout(() => roll(expression.replace(/s/g, ''), expression), CLOSE_MS);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Dice tray${mode !== 'normal' ? `, ${mode} on` : ''}`}
        onPress={() => setOpen(true)}
        style={[styles.fab, { bottom: insets.bottom + space.lg, backgroundColor: color }]}>
        <D20Icon size={38} ink={palettes.dark.table} />
        {mode !== 'normal' ? <View style={[styles.modeDot, { backgroundColor: mode === 'advantage' ? '#6DAA45' : '#C23B3B' }]} /> : null}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close dice tray" />
        <View style={[styles.tray, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Dice</Text>

          <View style={styles.segment} accessibilityRole="radiogroup">
            {MODES.map((m) => (
              <Pressable
                key={m.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: mode === m.id }}
                onPress={() => setMode(m.id)}
                style={[styles.segmentItem, mode === m.id && { backgroundColor: color }]}>
                <Text style={[styles.segmentText, { color: mode === m.id ? palettes.dark.table : palettes.dark.ink }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>Advantage applies to every d20 roll on the sheet until you switch it back.</Text>

          <Text style={styles.hint}>Tap dice to add them to the roll · long-press to remove one</Text>
          <View style={styles.dice}>
            {DICE.map((sides) => {
              const n = pool[sides] ?? 0;
              return (
                <Pressable
                  key={sides}
                  accessibilityRole="button"
                  accessibilityLabel={`Add a d${sides}${n ? `, ${n} in the roll` : ''}`}
                  accessibilityHint="Long-press to remove one"
                  onPress={() => addDie(sides)}
                  onLongPress={() => removeDie(sides)}
                  style={({ pressed }) => [styles.die, { borderColor: n ? color : palettes.dark.rule, opacity: pressed ? 0.7 : 1 }]}>
                  <Text style={styles.dieText}>{`d${sides}`}</Text>
                  {n ? (
                    <View style={[styles.dieBadge, { backgroundColor: color }]}>
                      <Text style={styles.dieBadgeText}>{`×${n}`}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.poolRow}>
            <Text style={styles.hint}>Modifier</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Lower modifier" onPress={() => setModifier((m) => m - 1)} style={styles.count}>
              <Text style={styles.countText}>−</Text>
            </Pressable>
            <Text style={styles.modifier} accessibilityLabel={`Modifier ${modifier}`}>{modifier > 0 ? `+${modifier}` : modifier}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Raise modifier" onPress={() => setModifier((m) => m + 1)} style={styles.count}>
              <Text style={styles.countText}>+</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              accessibilityRole="button"
              disabled={!poolSize && !modifier}
              onPress={() => {
                setPool({});
                setModifier(0);
              }}
              hitSlop={8}>
              <Text style={[styles.clear, !poolSize && !modifier && { opacity: 0.4 }]}>Clear</Text>
            </Pressable>
          </View>
          {poolSize >= MAX_POOL ? <Text style={styles.hint}>{`Up to ${MAX_POOL} dice at a time.`}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expression ? `Roll ${expression}` : 'Pick dice to roll'}
            disabled={!expression}
            onPress={rollPool}
            style={({ pressed }) => [styles.roll, { backgroundColor: color, opacity: !expression ? 0.35 : pressed ? 0.8 : 1 }]}>
            <D20Icon size={26} ink={palettes.dark.table} />
            <Text style={styles.rollText} numberOfLines={1}>
              {expression ? `Roll ${expression}` : 'Pick dice to roll'}
            </Text>
          </Pressable>

          <Text style={styles.section}>Dice animation</Text>
          <View style={styles.segment} accessibilityRole="radiogroup">
            {ANIMATIONS.map((a) => (
              <Pressable
                key={a.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: animation === a.id }}
                onPress={() => setAnimation(a.id)}
                style={[styles.segmentItem, animation === a.id && { backgroundColor: color }]}>
                <Text style={[styles.segmentText, { color: animation === a.id ? palettes.dark.table : palettes.dark.ink }]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>

          {__DEV__ ? (
            <View style={styles.countRow}>
              <Text style={styles.hint}>Dev: force next d20</Text>
              {[20, 1].map((face) => (
                <Pressable
                  key={face}
                  accessibilityRole="button"
                  accessibilityLabel={`Force next d20 to ${face}`}
                  onPress={() => setForceNextD20(forceNextD20 === face ? undefined : face)}
                  style={[styles.count, forceNextD20 === face && { borderColor: color }]}>
                  <Text style={styles.countText}>{face}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.section}>Recent rolls</Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {log.length === 0 ? <Text style={styles.hint}>Nothing rolled yet. Tap any stat on the sheet to roll it.</Text> : null}
            {log.map((r) => (
              <View key={r.at + r.label} style={styles.logRow}>
                <Text style={styles.logLabel} numberOfLines={1}>
                  {r.label}
                </Text>
                <Text style={[styles.logTotal, r.crit === 'success' && { color }, r.crit === 'fail' && { color: '#E0605A' }]}>{r.total}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: space.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(0,0,0,0.45)',
  },
  modeDot: { position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: palettes.dark.table },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  tray: { backgroundColor: '#1B1612', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: space.lg, gap: space.md },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palettes.dark.rule },
  title: { fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink },
  segment: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: palettes.dark.rule, overflow: 'hidden' },
  segmentItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  hint: { fontFamily: fonts.body, fontSize: 13, color: palettes.dark.inkMuted },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  count: { minWidth: 36, minHeight: 36, borderRadius: 18, borderWidth: 1.5, borderColor: palettes.dark.rule, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fonts.bodyBold, color: palettes.dark.ink },
  dice: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  die: { width: 64, height: 56, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dieText: { fontFamily: fonts.display, fontSize: 18, color: palettes.dark.ink },
  dieBadge: { position: 'absolute', top: -8, right: -8, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  dieBadgeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: palettes.dark.table },
  poolRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  modifier: { minWidth: 36, textAlign: 'center', fontFamily: fonts.display, fontSize: 20, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  clear: { fontFamily: fonts.bodyBold, fontSize: 14, color: palettes.dark.inkMuted, textDecorationLine: 'underline' },
  roll: { minHeight: 54, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.lg },
  rollText: { fontFamily: fonts.bodyBold, fontSize: 17, color: palettes.dark.table },
  section: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.3, color: palettes.dark.inkMuted, textTransform: 'uppercase', marginTop: space.sm },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule },
  logLabel: { flex: 1, fontFamily: fonts.body, color: palettes.dark.ink },
  logTotal: { fontFamily: fonts.display, fontSize: 18, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
});
