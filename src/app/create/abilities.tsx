import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ABILITIES, content, type Ability } from '@/content';
import { classMeta } from '@/content/meta/classes';
import { StepChoices } from '@/creator/StepChoices';
import { StepScreen } from '@/creator/StepScreen';
import { useCreator } from '@/creator/useCreator';
import type { Character } from '@/rules/character';
import { AbilityMedallion } from '@/ui/AbilityMedallion';
import { fonts, palettes, space } from '@/ui/theme';

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUDGET = 27;

const METHODS: { id: Character['abilityMethod']; label: string; hint: string }[] = [
  { id: 'standard', label: 'Standard', hint: 'Tap a number, then tap an ability to place it.' },
  { id: 'pointBuy', label: 'Point Buy', hint: 'Spend 27 points. Every score starts at 8; 15 is the most you can buy.' },
  { id: 'roll', label: 'Roll', hint: 'Roll 4d6 six times and drop the lowest die of each. Then place the totals.' },
];

const roll4d6 = () => Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6));
const total = (dice: number[]) => dice.reduce((a, b) => a + b, 0) - Math.min(...dice);

export default function AbilitiesStep() {
  const { draft, set, color, scoresComplete } = useCreator();
  const [token, setToken] = useState<number | null>(null);
  const method = draft.abilityMethod;
  const scores = draft.baseScores;

  // Racial bonuses (and chosen Half-Elf bonuses) shown on each medallion.
  const bonus = (a: Ability) => {
    const race = draft.race ? content.races.find(draft.race) : undefined;
    const sub = draft.subrace ? content.subraces.find(draft.subrace) : undefined;
    const fixed = [...(race?.abilityBonuses ?? []), ...(sub?.abilityBonuses ?? [])]
      .filter((b) => b.abilityScore === a)
      .reduce((n, b) => n + b.bonus, 0);
    const chosen = Object.entries(draft.choices)
      .filter(([k]) => k.endsWith(':abilityBonusOptions'))
      .flatMap(([, v]) => v)
      .filter((v) => v === a).length;
    return fixed + chosen || undefined;
  };

  const pool = method === 'roll' ? (draft.rolls ?? []).map(total) : STANDARD_ARRAY;
  // Which pool slots are already placed (handles duplicate values in rolls).
  const used = new Set<number>();
  for (const a of ABILITIES) {
    const v = scores[a];
    if (v === undefined) continue;
    const i = pool.findIndex((p, idx) => p === v && !used.has(idx));
    if (i >= 0) used.add(i);
  }

  const switchMethod = (m: Character['abilityMethod']) => {
    setToken(null);
    set({
      abilityMethod: m,
      baseScores: m === 'pointBuy' ? Object.fromEntries(ABILITIES.map((a) => [a, 8])) : {},
    });
  };

  const tapMedallion = (a: Ability) => {
    if (method === 'pointBuy') return;
    if (token !== null) {
      set({ baseScores: { ...scores, [a]: pool[token] } });
      setToken(null);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (scores[a] !== undefined) {
      const { [a]: _removed, ...rest } = scores;
      set({ baseScores: rest });
    }
  };

  const suggest = () => {
    if (!draft.classId || pool.length !== 6) return;
    const order = classMeta[draft.classId].quickBuildOrder;
    const sorted = [...pool].sort((x, y) => y - x);
    set({ baseScores: Object.fromEntries(order.map((a, i) => [a, sorted[i]])) });
    setToken(null);
  };

  const spent = ABILITIES.reduce((n, a) => n + (POINT_COST[scores[a] ?? 8] ?? 0), 0);
  const adjust = (a: Ability, delta: number) => {
    const next = (scores[a] ?? 8) + delta;
    if (next < 8 || next > 15) return;
    if (spent - POINT_COST[scores[a] ?? 8] + POINT_COST[next] > POINT_BUDGET) return;
    set({ baseScores: { ...scores, [a]: next } });
  };

  return (
    <StepScreen
      step="abilities"
      title="Ability scores"
      subtitle={METHODS.find((m) => m.id === method)!.hint}
      nextDisabled={!scoresComplete}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {METHODS.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: m.id === method }}
            onPress={() => switchMethod(m.id)}
            style={[styles.tab, m.id === method && { backgroundColor: color }]}>
            <Text style={[styles.tabText, { color: m.id === method ? palettes.dark.table : palettes.dark.ink }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {method === 'roll' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            set({ rolls: Array.from({ length: 6 }, roll4d6), baseScores: {} });
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          style={[styles.secondary, { borderColor: color }]}>
          <Text style={[styles.secondaryText, { color }]}>{draft.rolls ? 'Reroll all six' : 'Roll 4d6 × 6'}</Text>
        </Pressable>
      ) : null}

      {method !== 'pointBuy' && pool.length ? (
        <View style={styles.tokens}>
          {pool.map((value, i) => {
            const isUsed = used.has(i);
            const isPicked = token === i;
            return (
              <Pressable
                key={i}
                disabled={isUsed}
                accessibilityRole="button"
                accessibilityState={{ selected: isPicked, disabled: isUsed }}
                accessibilityLabel={`${value}${isUsed ? ', placed' : ''}`}
                onPress={() => setToken(isPicked ? null : i)}
                style={[
                  styles.token,
                  { borderColor: isPicked ? color : palettes.dark.rule, opacity: isUsed ? 0.3 : 1 },
                  isPicked && { backgroundColor: color },
                ]}>
                <Text style={[styles.tokenText, { color: isPicked ? palettes.dark.table : palettes.dark.ink }]}>{value}</Text>
                {method === 'roll' && draft.rolls ? (
                  <Text style={[styles.dice, { color: isPicked ? palettes.dark.table : palettes.dark.inkMuted }]}>
                    {dropLowestLabel(draft.rolls[i])}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {method === 'pointBuy' ? (
        <View style={styles.budget} accessible accessibilityLabel={`${POINT_BUDGET - spent} of ${POINT_BUDGET} points left`}>
          <View style={[styles.budgetFill, { width: `${(spent / POINT_BUDGET) * 100}%`, backgroundColor: color }]} />
          <Text style={styles.budgetText}>{`${POINT_BUDGET - spent} points left`}</Text>
        </View>
      ) : null}

      <View style={styles.medallions}>
        {ABILITIES.map((a) => (
          <View key={a} style={styles.medallionCell}>
            <Pressable
              onPress={() => tapMedallion(a)}
              disabled={method === 'pointBuy'}
              accessibilityRole="button"
              accessibilityHint={token !== null ? `Places ${pool[token]} here` : scores[a] !== undefined ? 'Clears this score' : undefined}>
              <AbilityMedallion ability={a} score={scores[a]} bonus={bonus(a)} color={color} />
            </Pressable>
            {method === 'pointBuy' ? (
              <View style={styles.stepper}>
                <Stepper label="−" onPress={() => adjust(a, -1)} a11y={`Lower ${a}`} />
                <Stepper label="+" onPress={() => adjust(a, 1)} a11y={`Raise ${a}`} />
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {method !== 'pointBuy' && draft.classId && pool.length === 6 ? (
        <Pressable accessibilityRole="button" onPress={suggest} style={[styles.secondary, { borderColor: palettes.dark.rule }]}>
          <Text style={[styles.secondaryText, { color: palettes.dark.ink }]}>{`Suggested for ${content.classes.get(draft.classId).name}`}</Text>
        </Pressable>
      ) : null}

      <StepChoices step="abilities" />
    </StepScreen>
  );
}

function dropLowestLabel(dice: number[]) {
  const low = dice.indexOf(Math.min(...dice));
  return dice.map((d, i) => (i === low ? `(${d})` : `${d}`)).join(' ');
}

function Stepper({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} hitSlop={6} style={styles.stepperButton}>
      <Text style={styles.stepperText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: palettes.dark.rule, overflow: 'hidden' },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontFamily: fonts.bodyBold, fontSize: 15 },
  tokens: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  token: { minWidth: 52, minHeight: 52, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tokenText: { fontFamily: fonts.display, fontSize: 24, fontVariant: ['tabular-nums'] },
  dice: { fontFamily: fonts.body, fontSize: 10 },
  medallions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: space.xl, rowGap: space.xxl, paddingTop: space.md },
  medallionCell: { alignItems: 'center', gap: space.lg, width: 96 },
  stepper: { flexDirection: 'row', gap: space.md },
  stepperButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: palettes.dark.rule, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontFamily: fonts.bodyBold, fontSize: 20, color: palettes.dark.ink },
  budget: { height: 32, borderRadius: 6, borderWidth: 1, borderColor: palettes.dark.rule, justifyContent: 'center', overflow: 'hidden' },
  budgetFill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.35 },
  budgetText: { textAlign: 'center', fontFamily: fonts.bodyBold, color: palettes.dark.ink },
  secondary: { minHeight: 46, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
