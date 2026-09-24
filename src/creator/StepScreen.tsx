import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useCreator, type StepId } from '@/creator/useCreator';
import { fonts, palettes, space } from '@/ui/theme';

type Props = {
  step: StepId;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Content that should span the full width (e.g. a carousel) rather than the padded column. */
  fullBleed?: ReactNode;
  nextLabel?: string;
  onNext?: () => void;
  nextDisabled?: boolean;
};

/** Scrolling body for one creator step, with a "Next" button that moves to the following step. */
export function StepScreen({ step, title, subtitle, children, fullBleed, nextLabel, onNext, nextDisabled }: Props) {
  const { steps, color } = useCreator();
  const index = steps.findIndex((s) => s.id === step);
  const next = steps[index + 1];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.column}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {fullBleed}
      <View style={[styles.column, { gap: space.xl }]}>
        {children}
        {next || onNext ? (
          <Pressable
            accessibilityRole="button"
            disabled={nextDisabled}
            onPress={onNext ?? (() => router.push(`/create/${next.id}`))}
            style={({ pressed }) => [styles.next, { backgroundColor: color, opacity: nextDisabled ? 0.4 : pressed ? 0.8 : 1 }]}>
            <Text style={styles.nextText}>{nextLabel ?? `Next: ${next?.title}`}</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: palettes.dark.table },
  content: { paddingVertical: space.lg, paddingBottom: 120 },
  column: { paddingHorizontal: space.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { fontFamily: fonts.display, fontSize: 32, color: palettes.dark.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: palettes.dark.inkMuted, marginTop: space.xs },
  next: { minHeight: 52, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: space.md },
  nextText: { fontFamily: fonts.bodyBold, fontSize: 17, color: palettes.dark.table, letterSpacing: 0.4 },
});
