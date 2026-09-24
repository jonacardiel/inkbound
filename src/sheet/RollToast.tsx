import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RollResult } from '@/rules/dice';
import { useDiceSettings, useRolls } from '@/sheet/rolls';
import { fonts, palettes, space } from '@/ui/theme';

const TUMBLE_MS = 450;

/** Floating result of the latest roll. The total "tumbles" briefly before settling (remounted per roll). */
export function RollToast({ color }: { color: string }) {
  const latest = useRolls((s) => s.latest);
  const dismiss = useRolls((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  // Auto-dismiss after a few seconds; a new roll restarts the timer.
  useEffect(() => {
    if (!latest) return;
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
  }, [latest, dismiss]);

  if (!latest) return null;
  return (
    <Animated.View
      key={latest.at}
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(150)}
      style={[styles.wrap, { bottom: insets.bottom + 88 }]}
      pointerEvents="box-none">
      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel={`${latest.label}: ${latest.total}${latest.crit === 'success' ? ', natural 20' : latest.crit === 'fail' ? ', natural 1' : ''}. Tap to dismiss.`}
        accessibilityLiveRegion="polite"
        style={[styles.toast, { borderColor: latest.crit === 'success' ? color : latest.crit === 'fail' ? '#C23B3B' : palettes.dark.rule }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label} numberOfLines={1}>
            {latest.label}
            {latest.mode !== 'normal' ? `  · ${latest.mode}` : ''}
          </Text>
          <Text style={styles.breakdown} numberOfLines={1}>
            {breakdown(latest)}
          </Text>
        </View>
        <Total key={latest.at} result={latest} color={color} />
      </Pressable>
    </Animated.View>
  );
}

function Total({ result, color }: { result: RollResult; color: string }) {
  // No tumble with Reduce Motion, when the animation is off, or after the 3D stage already showed the roll.
  const reduceMotion = useReducedMotion() || useDiceSettings.getState().animation !== 'quick';
  const max = result.dice.reduce((n, d) => n + d.sides * d.kept.length, result.modifier);
  const [shown, setShown] = useState(reduceMotion ? result.total : 1);

  useEffect(() => {
    if (reduceMotion) return;
    const start = Date.now();
    const tick = setInterval(() => {
      if (Date.now() - start >= TUMBLE_MS) {
        clearInterval(tick);
        setShown(result.total);
      } else {
        setShown(1 + Math.floor(Math.random() * Math.max(1, max)));
      }
    }, 50);
    return () => clearInterval(tick);
  }, [result, max, reduceMotion]);

  const settled = shown === result.total;
  const critColor = result.crit === 'success' ? color : result.crit === 'fail' ? '#E0605A' : palettes.dark.ink;
  return (
    <View style={styles.totalWrap}>
      <Text style={[styles.total, { color: settled ? critColor : palettes.dark.inkMuted }]}>{shown}</Text>
      {settled && result.crit ? <Text style={[styles.crit, { color: critColor }]}>{result.crit === 'success' ? 'NAT 20' : 'NAT 1'}</Text> : null}
    </View>
  );
}

function breakdown(r: RollResult): string {
  const dice = r.dice
    .map((d) =>
      d.results.length > d.kept.length
        ? `d${d.sides} [${d.results.join(', ')}] → ${d.kept[0]}`
        : `${d.results.length}d${d.sides} [${d.results.join(', ')}]`,
    )
    .join(' + ');
  return r.modifier ? `${dice} ${r.modifier > 0 ? '+' : '−'} ${Math.abs(r.modifier)}` : dice;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg, alignItems: 'center' },
  toast: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    paddingLeft: space.lg,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#100D0B',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  label: { fontFamily: fonts.display, fontSize: 17, color: palettes.dark.ink },
  breakdown: { fontFamily: fonts.body, fontSize: 13, color: palettes.dark.inkMuted, marginTop: 2 },
  totalWrap: { minWidth: 64, alignItems: 'center' },
  total: { fontFamily: fonts.display, fontSize: 40, fontVariant: ['tabular-nums'] },
  crit: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.2 },
});
