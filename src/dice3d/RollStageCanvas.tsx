import { Canvas, createPicture, Picture, useFont } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, useDerivedValue, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { RollResult } from '@/rules/dice';
import { fonts, palettes, space } from '@/ui/theme';

import { drawDie, drawShadow, FONT_BASE } from './draw';
import { drawBurst, drawCrack } from './effects';
import { driftAt, entryAt, heightAt, IMPACTS, orientationAt, planThrow, squashAt, type Throw } from './motion';
import { polyhedron, type Polyhedron, type Sides } from './polyhedra';

const D20_MS = 1400;
const DAMAGE_MS = 1050;

type StagedDie = { poly: Polyhedron; value: number; plan: Throw; kept: boolean; delay: number; cx: number; cy: number; radius: number };

type Phase = 'rolling' | 'landed' | 'total';

/** Lays out the dice: one big die, or a row/grid of smaller ones for damage. */
function stageDice(roll: RollResult, width: number, height: number): StagedDie[] {
  const dice = roll.dice.flatMap((d) =>
    d.results.map((value, i) => ({
      sides: d.sides as Sides,
      value,
      // With advantage/disadvantage, only the kept d20 counts.
      kept: d.results.length === d.kept.length || (d.kept[0] === value && d.results.indexOf(value) === i),
    })),
  );
  const count = dice.length;
  const cols = Math.min(count, 4);
  const rows = Math.ceil(count / cols);
  const base = Math.min(width, height);
  const radius = count === 1 ? base * 0.2 : count === 2 ? base * 0.15 : Math.min(base * 0.11, (width * 0.9) / cols / 2.4);
  const gapX = radius * 2.5;
  const gapY = radius * 2.5;
  return dice.map((d, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, count - row * cols);
    const poly = polyhedron(d.sides);
    return {
      poly,
      value: d.value,
      plan: planThrow(poly, d.value),
      kept: d.kept,
      delay: i * 0.05,
      cx: width / 2 + (col - (inRow - 1) / 2) * gapX,
      cy: height * 0.42 + (row - (rows - 1) / 2) * gapY,
      radius,
    };
  });
}

/**
 * The full-screen dice stage: the dice are thrown in, tumble, bounce and land
 * on the rolled faces; then the modifier and total appear, with crit effects.
 * Tap anywhere to skip ahead; it closes itself shortly after.
 */
export default function RollStageCanvas({ roll, color, onDone }: { roll: RollResult; color: string; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const font = useFont(require('@expo-google-fonts/old-standard-tt/700Bold/OldStandardTT_700Bold.ttf'), FONT_BASE);
  const dice = useMemo(() => stageDice(roll, width, height), [roll, width, height]);
  const isD20 = dice.length > 0 && dice.every((d) => d.poly.sides === 20);
  const duration = isD20 ? D20_MS : DAMAGE_MS;
  const [phase, setPhase] = useState<Phase>('rolling');

  const progress = useSharedValue(0);
  const glow = useSharedValue(0);
  const effect = useSharedValue(0);
  const crit = roll.crit;

  useEffect(() => {
    const land = () => setPhase('landed');
    progress.set(withTiming(1, { duration, easing: Easing.linear }, (finished) => {
      if (finished) scheduleOnRN(land);
    }));
    // Haptic tap on each bounce.
    const timers =
      Platform.OS === 'web'
        ? []
        : IMPACTS.map((t, i) =>
            setTimeout(() => Haptics.impactAsync([Haptics.ImpactFeedbackStyle.Heavy, Haptics.ImpactFeedbackStyle.Medium, Haptics.ImpactFeedbackStyle.Light][i]), t * duration),
          );
    return () => timers.forEach(clearTimeout);
  }, [progress, duration]);

  // After landing: glow the face, run crit effects, show the total, then close.
  useEffect(() => {
    if (phase === 'landed') {
      glow.set(withTiming(1, { duration: 250 }));
      effect.set(withTiming(1, { duration: crit ? 900 : 1 }));
      if (crit && Platform.OS !== 'web') {
        Haptics.notificationAsync(crit === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
      }
      const t = setTimeout(() => setPhase('total'), roll.modifier || dice.length > 1 ? 450 : 200);
      return () => clearTimeout(t);
    }
    if (phase === 'total') {
      const t = setTimeout(onDone, crit ? 2600 : 1800);
      return () => clearTimeout(t);
    }
  }, [phase, glow, effect, crit, roll.modifier, dice.length, onDone]);

  const skip = () => {
    if (phase === 'rolling') {
      cancelAnimation(progress);
      progress.set(1);
      setPhase('landed');
    } else {
      onDone();
    }
  };

  const picture = useDerivedValue(() =>
    createPicture((canvas) => {
      for (const d of dice) {
        const t = Math.max(0, Math.min(1, (progress.value - d.delay) / (1 - d.delay)));
        const h = heightAt(t);
        const [sx, sy] = squashAt(t);
        const x = d.cx + driftAt(d.plan, t) * d.radius;
        const floorY = d.cy + d.radius * 0.95;
        const y = d.cy - h * d.radius * 0.9 + entryAt(t) * height;
        // The die that doesn't count (advantage/disadvantage) fades once landed.
        const opacity = d.kept ? 1 : 1 - glow.value * 0.65;
        drawShadow(canvas, x, floorY, d.radius, h, opacity);
        if (d.kept && crit === 'success') drawBurst(canvas, d.cx, d.cy, d.radius, effect.value, color);
        drawDie(canvas, d.poly, orientationAt(d.plan, t), x, y, d.radius, sx, sy, font, {
          opacity,
          highlight: d.kept && glow.value > 0.5 ? (crit === 'fail' ? '#B3261E' : color) : undefined,
          highlightValue: d.value,
        });
        if (d.kept && crit === 'fail') drawCrack(canvas, d.cx, d.cy, d.radius, effect.value);
      }
    }),
  );

  const diceTotal = roll.total - roll.modifier;
  const bannerColor = crit === 'success' ? color : '#E0605A';

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={skip} accessibilityRole="button" accessibilityLabel={`Rolling ${roll.label}. Tap to skip.`}>
      <Animated.View entering={FadeIn.duration(150)} style={[StyleSheet.absoluteFill, styles.backdrop]} />
      {crit === 'fail' && phase !== 'rolling' ? <Animated.View entering={FadeIn.duration(80)} style={[StyleSheet.absoluteFill, styles.redFlash]} /> : null}
      <Text style={styles.label} numberOfLines={1}>
        {roll.label}
        {roll.mode !== 'normal' ? ` · ${roll.mode}` : ''}
      </Text>
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={picture} />
      </Canvas>

      {phase === 'total' ? (
        <View style={[styles.results, { top: height * 0.66 }]} accessibilityLiveRegion="polite">
          {roll.modifier || dice.length > 1 ? (
            <Animated.Text entering={FadeIn.duration(200)} style={styles.math}>
              {`${dice.length > 1 ? dice.filter((d) => d.kept).map((d) => d.value).join(' + ') : diceTotal}${roll.modifier ? ` ${roll.modifier > 0 ? '+' : '−'} ${Math.abs(roll.modifier)}` : ''}`}
            </Animated.Text>
          ) : null}
          <Animated.Text entering={ZoomIn.springify().damping(12)} style={[styles.total, crit && { color: bannerColor }]}>
            {roll.total}
          </Animated.Text>
          {crit ? (
            <Animated.Text entering={ZoomIn.delay(120).springify()} style={[styles.banner, { color: bannerColor, borderColor: bannerColor }]}>
              {crit === 'success' ? 'CRITICAL SUCCESS' : 'CRITICAL FAILURE'}
            </Animated.Text>
          ) : null}
          <Text style={styles.hint}>Tap to continue</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(10,8,6,0.82)' },
  redFlash: { backgroundColor: 'rgba(160,20,20,0.18)' },
  label: {
    position: 'absolute',
    top: 72,
    left: space.lg,
    right: space.lg,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 26,
    color: palettes.dark.ink,
  },
  results: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: space.xs },
  math: { fontFamily: fonts.body, fontSize: 18, color: palettes.dark.inkMuted, fontVariant: ['tabular-nums'] },
  total: { fontFamily: fonts.display, fontSize: 72, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  banner: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 3,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: space.md,
  },
  hint: { fontFamily: fonts.body, fontSize: 12, color: palettes.dark.inkMuted, marginTop: space.md },
});
