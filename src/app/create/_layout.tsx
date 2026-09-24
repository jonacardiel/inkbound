import { router, Stack, usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { content } from '@/content';
import { useCreator } from '@/creator/useCreator';
import { ArtImage } from '@/ui/ArtImage';
import { fonts, palettes, space } from '@/ui/theme';

export default function CreatorLayout() {
  return (
    <View style={styles.root}>
      <StepStrip />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palettes.dark.table }, animation: 'fade' }} />
      </View>
      <BuildBar />
    </View>
  );
}

/** Non-linear step navigation. A dot marks steps with unanswered picks. */
function StepStrip() {
  const { steps, needsAttention, color } = useCreator();
  const pathname = usePathname();
  const current = pathname.split('/').pop();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.strip, { paddingTop: insets.top + space.sm }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close creator" onPress={() => router.dismissTo('/')} hitSlop={10} style={styles.close}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
        {steps.map((step) => {
          const active = step.id === current;
          const attention = needsAttention(step.id);
          return (
            <Pressable
              key={step.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${step.title}${attention ? ', needs attention' : ''}`}
              onPress={() => router.replace(`/create/${step.id}`)}
              style={[styles.step, active && { borderBottomColor: color }]}>
              <Text style={[styles.stepText, { color: active ? palettes.dark.ink : palettes.dark.inkMuted }]}>{step.title}</Text>
              {attention ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Live preview of the build: race art, class, and the numbers the rules engine derives. */
function BuildBar() {
  const { draft, sheet, color } = useCreator();
  const insets = useSafeAreaInsets();
  const race = draft.race ? content.races.find(draft.race) : undefined;
  const subrace = draft.subrace ? content.subraces.find(draft.subrace) : undefined;
  const cls = draft.classId ? content.classes.find(draft.classId) : undefined;

  const stat = (label: string, value?: number | string) => (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value ?? '–'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + space.sm, borderTopColor: color }]}>
      {race ? (
        <ArtImage kind="races" id={race.index} name={race.name} color={color} aspect="1:1" style={styles.barArt} />
      ) : (
        <View style={[styles.barArt, styles.barArtEmpty]} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.barTitle} numberOfLines={1}>
          {draft.name.trim() || 'New hero'}
        </Text>
        <Text style={styles.barSub} numberOfLines={1}>
          {[subrace?.name ?? race?.name, cls?.name].filter(Boolean).join(' ') || 'Choose a race and class'}
        </Text>
      </View>
      {stat('HP', sheet?.maxHp)}
      {stat('AC', sheet?.ac)}
      {stat('Speed', sheet ? `${sheet.speed}` : undefined)}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palettes.dark.table },
  strip: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule },
  close: { paddingHorizontal: space.lg, paddingVertical: space.sm },
  closeText: { color: palettes.dark.inkMuted, fontSize: 18 },
  stripContent: { paddingRight: space.lg },
  step: { paddingHorizontal: space.md, paddingVertical: space.md, borderBottomWidth: 2, borderBottomColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    backgroundColor: '#100D0B',
    borderTopWidth: 2,
  },
  barArt: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  barArtEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: palettes.dark.rule },
  barTitle: { fontFamily: fonts.display, fontSize: 17, color: palettes.dark.ink },
  barSub: { fontFamily: fonts.body, fontSize: 13, color: palettes.dark.inkMuted },
  stat: { alignItems: 'center', minWidth: 38 },
  statValue: { fontFamily: fonts.display, fontSize: 20, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: palettes.dark.inkMuted, textTransform: 'uppercase' },
});
