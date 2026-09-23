import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { fonts, palettes } from '@/ui/theme';

/** Paper back of a flip card: title, spot-color rule and scrollable details. */
export function CardBack({ title, subtitle, color, children }: { title: string; subtitle?: string; color: string; children: ReactNode }) {
  return (
    <View style={styles.page}>
      <View style={styles.innerRule}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={[styles.rule, { backgroundColor: color }]} />
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

export function BackSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function BackText({ children }: { children: ReactNode }) {
  return <Text style={styles.text}>{children}</Text>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palettes.dark.page, borderRadius: 8, padding: 6, borderWidth: 1, borderColor: palettes.dark.rule },
  innerRule: { flex: 1, borderWidth: 1, borderColor: palettes.dark.pageInk, borderRadius: 3, padding: 16 },
  title: { fontFamily: fonts.display, fontSize: 26, color: palettes.dark.pageInk },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: '#5A4D3E', marginTop: 2 },
  rule: { width: 40, height: 2, marginVertical: 10 },
  body: { gap: 14, paddingBottom: 8 },
  section: { gap: 4 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.4, color: '#5A4D3E', textTransform: 'uppercase' },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: palettes.dark.pageInk },
});
