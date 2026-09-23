import { StyleSheet, Text, View } from 'react-native';

import type { Ability } from '@/content';
import { fonts, palettes } from '@/ui/theme';

type Props = {
  ability: Ability;
  score?: number;
  /** Racial or other bonus shown as a badge. */
  bonus?: number;
  color?: string;
  size?: number;
};

const LABEL: Record<Ability, string> = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
const NAME: Record<Ability, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export const modifier = (score: number) => Math.floor((score - 10) / 2);
export const signedNumber = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/**
 * Round ability medallion: modifier large, score small. An empty medallion
 * (no score) is a drop target in the creator.
 */
export function AbilityMedallion({ ability, score, bonus, color = palettes.dark.accent, size = 88 }: Props) {
  const total = score === undefined ? undefined : score + (bonus ?? 0);
  const label =
    total === undefined
      ? `${NAME[ability]}, not assigned`
      : `${NAME[ability]} ${total}, modifier ${signedNumber(modifier(total))}${bonus ? `, including ${signedNumber(bonus)} bonus` : ''}`;

  return (
    <View accessible accessibilityLabel={label} style={{ width: size, alignItems: 'center' }}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: total === undefined ? palettes.dark.rule : color,
            borderStyle: total === undefined ? 'dashed' : 'solid',
          },
        ]}>
        <Text style={styles.label}>{LABEL[ability]}</Text>
        <Text style={[styles.mod, { fontSize: size * 0.32 }]}>{total === undefined ? '–' : signedNumber(modifier(total))}</Text>
        <View style={[styles.scoreTab, { borderColor: total === undefined ? palettes.dark.rule : color }]}>
          <Text style={styles.score}>{total ?? '—'}</Text>
        </View>
      </View>
      {bonus ? (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{signedNumber(bonus)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F1914' },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2, color: palettes.dark.inkMuted },
  mod: { fontFamily: fonts.display, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  scoreTab: {
    position: 'absolute',
    bottom: -10,
    minWidth: 34,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: palettes.dark.table,
    alignItems: 'center',
  },
  score: { fontFamily: fonts.bodyBold, fontSize: 13, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  badge: { position: 'absolute', top: -4, right: -4, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: palettes.dark.table },
});
