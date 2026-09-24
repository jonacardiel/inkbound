import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Mode } from '@/rules/dice';
import { useRolls } from '@/sheet/rolls';
import { fonts, palettes, space } from '@/ui/theme';

const DICE = [4, 6, 8, 10, 12, 20, 100];
const MODES: { id: Mode; label: string }[] = [
  { id: 'disadvantage', label: 'Disadv.' },
  { id: 'normal', label: 'Normal' },
  { id: 'advantage', label: 'Advantage' },
];

/** Floating dice button and the tray it opens: free dice, the advantage toggle, and the roll log. */
export function DiceTray({ color }: { color: string }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const { roll, mode, setMode, log } = useRolls();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Dice tray${mode !== 'normal' ? `, ${mode} on` : ''}`}
        onPress={() => setOpen(true)}
        style={[styles.fab, { bottom: insets.bottom + space.lg, backgroundColor: color }]}>
        <Text style={styles.fabText}>d20</Text>
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

          <View style={styles.countRow}>
            <Text style={styles.hint}>How many</Text>
            {[1, 2, 3, 4, 6, 8].map((n) => (
              <Pressable key={n} accessibilityRole="radio" accessibilityState={{ checked: count === n }} onPress={() => setCount(n)} style={[styles.count, count === n && { borderColor: color }]}>
                <Text style={styles.countText}>{n}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.dice}>
            {DICE.map((sides) => (
              <Pressable
                key={sides}
                accessibilityRole="button"
                accessibilityLabel={`Roll ${count} d${sides}`}
                onPress={() => roll(`${count}d${sides}`, `${count}d${sides}`)}
                style={({ pressed }) => [styles.die, { borderColor: color, opacity: pressed ? 0.7 : 1 }]}>
                <Text style={styles.dieText}>{`d${sides}`}</Text>
              </Pressable>
            ))}
          </View>

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
  fabText: { fontFamily: fonts.display, fontSize: 18, color: palettes.dark.table },
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
  section: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.3, color: palettes.dark.inkMuted, textTransform: 'uppercase', marginTop: space.sm },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule },
  logLabel: { flex: 1, fontFamily: fonts.body, color: palettes.dark.ink },
  logTotal: { fontFamily: fonts.display, fontSize: 18, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
});
