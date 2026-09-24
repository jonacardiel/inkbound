import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fonts, palettes, space } from '@/ui/theme';

/** Scrollable tab body with room for the dice button. */
export function TabBody({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={{ backgroundColor: palettes.dark.table }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

/** A small labelled number; tappable when it can be rolled. */
export function StatBox({ label, value, sub, onPress, a11y }: { label: string; value: string | number; sub?: string; onPress?: () => void; a11y?: string }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={a11y ?? `${label} ${value}${onPress ? ', tap to roll' : ''}`}
      style={({ pressed }) => [styles.stat, pressed && { backgroundColor: '#2A231D' }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </Pressable>
  );
}

/** A tappable list row: name on the left, a bonus or value on the right. */
export function Row({ title, detail, value, onPress, marker, a11y }: { title: string; detail?: string; value?: string; onPress?: () => void; marker?: string; a11y?: string }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={a11y}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#211B16' }]}>
      {marker ? <Text style={styles.marker}>{marker}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </Pressable>
  );
}

export function Button({ label, onPress, color, kind = 'outline', disabled, a11y }: { label: string; onPress: () => void; color: string; kind?: 'solid' | 'outline'; disabled?: boolean; a11y?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        kind === 'solid' ? { backgroundColor: color } : { borderColor: color, borderWidth: 1.5 },
        { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}>
      <Text style={[styles.buttonText, { color: kind === 'solid' ? palettes.dark.table : color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, paddingBottom: 140, gap: space.xl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  section: { gap: space.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.display, fontSize: 20, color: palettes.dark.ink },
  stat: { flex: 1, minWidth: 64, alignItems: 'center', paddingVertical: space.sm, borderRadius: 8, borderWidth: 1, borderColor: palettes.dark.rule },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: palettes.dark.inkMuted, textTransform: 'uppercase' },
  statSub: { fontFamily: fonts.body, fontSize: 11, color: palettes.dark.inkMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48, paddingVertical: space.sm, paddingHorizontal: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule },
  marker: { width: 18, textAlign: 'center', fontFamily: fonts.bodyBold, color: palettes.dark.accent },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: palettes.dark.ink },
  rowDetail: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: palettes.dark.inkMuted, marginTop: 2 },
  rowValue: { fontFamily: fonts.display, fontSize: 20, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  button: { minHeight: 46, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
