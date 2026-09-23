import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/ui/theme';

type Props = { label: string; color?: string; tone?: 'onPage' | 'onDark' };

/** Small stat chip, e.g. "+2 CON" or "Darkvision". */
export function Chip({ label, color, tone = 'onDark' }: Props) {
  const ink = tone === 'onDark' ? '#EDE3CF' : '#1E1812';
  return (
    <View style={[styles.chip, { borderColor: color ?? ink }]}>
      <Text style={[styles.text, { color: color ?? ink }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.3 },
});
