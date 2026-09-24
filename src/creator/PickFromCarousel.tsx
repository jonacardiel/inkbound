import * as Haptics from 'expo-haptics';
import { useState, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { CardCarousel } from '@/ui/CardCarousel';
import { fonts, palettes, space } from '@/ui/theme';

type Props<T extends { index: string; name: string }> = {
  items: T[];
  selectedId?: string;
  onSelect: (item: T) => void;
  renderCard: (item: T, width: number, selected: boolean) => ReactElement;
  color: string;
};

/** A card carousel with a "Choose X" button for whichever card is centered. */
export function PickFromCarousel<T extends { index: string; name: string }>({ items, selectedId, onSelect, renderCard, color }: Props<T>) {
  // Start on the current pick so returning to the step shows it.
  const initial = Math.max(0, items.findIndex((i) => i.index === selectedId));
  const [focused, setFocused] = useState(initial);
  const item = items[focused];
  const chosen = item.index === selectedId;

  return (
    <View>
      <CardCarousel
        items={items}
        keyOf={(i) => i.index}
        initialIndex={initial}
        onFocus={(_, index) => setFocused(index)}
        renderCard={(i, width) => renderCard(i, width, i.index === selectedId)}
      />
      <Text style={styles.hint}>Swipe to browse · tap a card to flip it</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: chosen }}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            onSelect(item);
          }}
          style={({ pressed }) => [
            styles.choose,
            chosen ? { backgroundColor: color, borderColor: color } : { borderColor: color },
            pressed && { opacity: 0.8 },
          ]}>
          <Text style={[styles.chooseText, { color: chosen ? palettes.dark.table : color }]}>
            {chosen ? `✓ ${item.name} chosen` : `Choose ${item.name}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: palettes.dark.inkMuted },
  row: { paddingHorizontal: space.lg, marginTop: space.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  choose: { minHeight: 50, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  chooseText: { fontFamily: fonts.bodyBold, fontSize: 17 },
});
