import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  max: number;
  /** How many are spent (shown hollow). */
  spent: number;
  color: string;
  label: string;
  /** Tapping a filled pip spends one; tapping a hollow pip restores one. */
  onChange?: (spent: number) => void;
};

/**
 * A row of pips for spell slots and limited-use resources. Filled = available.
 * Large pools (over 12, e.g. Lay on Hands) should use a number instead.
 */
export function Pips({ max, spent, color, label, onChange }: Props) {
  const available = max - spent;
  return (
    <View
      style={styles.row}
      accessible={!onChange}
      accessibilityLabel={`${label}: ${available} of ${max} available`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < available;
        return (
          <Pressable
            key={i}
            disabled={!onChange}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${i + 1}, ${filled ? 'available' : 'spent'}`}
            onPress={() => onChange?.(filled ? spent + 1 : spent - 1)}
            style={[styles.pip, { borderColor: color, backgroundColor: filled ? color : 'transparent' }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pip: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, transform: [{ rotate: '45deg' }] },
});
