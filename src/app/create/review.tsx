import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { ABILITIES, content } from '@/content';
import { StepScreen } from '@/creator/StepScreen';
import { STEPS, useCreator } from '@/creator/useCreator';
import { finalizeCharacter } from '@/rules/creation';
import { useCharacters } from '@/state/characters';
import { signedNumber } from '@/ui/AbilityMedallion';
import { ArtCard } from '@/ui/ArtCard';
import { fonts, palettes, space } from '@/ui/theme';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export default function ReviewStep() {
  const { draft, character, sheet, color, steps, needsAttention, reset } = useCreator();
  const save = useCharacters((s) => s.save);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(340, width - space.lg * 2);

  // Hero reveal: the card rises and fades in.
  const reduceMotion = useReducedMotion();
  const reveal = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    reveal.value = withDelay(150, withTiming(1, { duration: reduceMotion ? 0 : 700 }));
  }, [reveal, reduceMotion]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 24 }, { scale: 0.96 + reveal.value * 0.04 }],
  }));

  const missing = steps.filter((s) => s.id !== 'review' && needsAttention(s.id));
  const cls = draft.classId ? content.classes.find(draft.classId) : undefined;
  const race = draft.subrace ? content.subraces.find(draft.subrace) : draft.race ? content.races.find(draft.race) : undefined;

  const create = () => {
    if (!character) return;
    const finished = finalizeCharacter(character, newId());
    save(finished);
    reset();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.dismissTo('/');
  };

  return (
    <StepScreen step="review" title="Your hero" onNext={create} nextLabel="Create character" nextDisabled={!character || missing.length > 0}>
      {cls ? (
        <Animated.View style={[{ alignItems: 'center' }, revealStyle]}>
          <ArtCard
            kind="classes"
            id={cls.index}
            name={draft.name.trim() || 'Unnamed hero'}
            tagline={`${race?.name ?? ''} ${cls.name}, level 1`}
            color={color}
            width={cardWidth}
            selected
          />
        </Animated.View>
      ) : null}

      {sheet ? (
        <>
          <View style={styles.statRow}>
            {[
              ['HP', sheet.maxHp],
              ['AC', sheet.ac],
              ['Speed', `${sheet.speed} ft`],
              ['Init', signedNumber(sheet.initiative)],
              ['Prof', signedNumber(sheet.profBonus)],
            ].map(([label, value]) => (
              <View key={label} style={styles.stat}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statRow}>
            {ABILITIES.map((a) => (
              <View key={a} style={styles.stat}>
                <Text style={styles.statValue}>{signedNumber(sheet.abilities[a].mod)}</Text>
                <Text style={styles.statLabel}>{`${a.toUpperCase()} ${sheet.abilities[a].score}`}</Text>
              </View>
            ))}
          </View>
          {sheet.attacks.length ? (
            <View style={{ gap: 4 }}>
              {sheet.attacks.map((atk) => (
                <Text key={atk.name} style={styles.line}>{`${atk.name}: ${signedNumber(atk.toHit)} to hit, ${atk.damage} ${atk.damageType}`}</Text>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {missing.length ? (
        <View style={[styles.missing, { borderColor: color }]}>
          <Text style={styles.missingTitle}>Still to choose</Text>
          {missing.map((s) => (
            <Pressable key={s.id} accessibilityRole="link" onPress={() => router.replace(`/create/${s.id}`)} style={styles.missingRow}>
              <Text style={[styles.line, { color }]}>{`${STEPS.find((x) => x.id === s.id)!.title} →`}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  stat: { minWidth: 56, alignItems: 'center', paddingVertical: space.sm, paddingHorizontal: space.xs, borderRadius: 6, borderWidth: 1, borderColor: palettes.dark.rule },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: palettes.dark.inkMuted },
  line: { fontFamily: fonts.body, fontSize: 15, color: palettes.dark.ink },
  missing: { borderWidth: 1, borderRadius: 8, padding: space.md, gap: space.sm },
  missingTitle: { fontFamily: fonts.display, fontSize: 18, color: palettes.dark.ink },
  missingRow: { minHeight: 36, justifyContent: 'center' },
});
