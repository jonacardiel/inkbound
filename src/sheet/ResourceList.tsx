import { StyleSheet, Text, View } from 'react-native';

import type { Resource } from '@/rules/resources';
import { useSheet } from '@/sheet/useSheet';
import { Button, Section } from '@/sheet/parts';
import { Pips } from '@/ui/Pips';
import { fonts, palettes, space } from '@/ui/theme';

const MAX_PIPS = 12;

/** Limited-use abilities as pips (or a counter for big pools like Lay on Hands). */
export function ResourceList({ filter = () => true }: { filter?: (r: Resource) => boolean }) {
  const { character, sheet, color, update } = useSheet()!;
  const resources = sheet.resources.filter(filter);
  if (!resources.length) return null;

  const setSpent = (id: string, spent: number) =>
    update((c) => ({ ...c, play: { ...c.play, resourcesSpent: { ...c.play.resourcesSpent, [id]: Math.max(0, spent) } } }));

  return (
    <Section title="Abilities per rest">
      {resources.map((r) => {
        const spent = character.play.resourcesSpent[r.id] ?? 0;
        const unlimited = r.max >= 9999;
        return (
          <View key={r.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.name}</Text>
              <Text style={styles.reset}>{unlimited ? 'Unlimited' : `Resets on a ${r.reset} rest`}</Text>
            </View>
            {unlimited ? null : r.max <= MAX_PIPS ? (
              <Pips max={r.max} spent={Math.min(spent, r.max)} color={color} label={r.name} onChange={(n) => setSpent(r.id, Math.min(n, r.max))} />
            ) : (
              <View style={styles.counter}>
                <Button label="−" color={palettes.dark.rule} a11y={`Spend 1 ${r.name}`} onPress={() => setSpent(r.id, Math.min(r.max, spent + 1))} />
                <Text style={styles.count} accessibilityLabel={`${r.max - spent} of ${r.max} left`}>{`${r.max - spent}/${r.max}`}</Text>
                <Button label="+" color={palettes.dark.rule} a11y={`Restore 1 ${r.name}`} onPress={() => setSpent(r.id, spent - 1)} />
              </View>
            )}
          </View>
        );
      })}
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: palettes.dark.ink },
  reset: { fontFamily: fonts.body, fontSize: 12, color: palettes.dark.inkMuted },
  counter: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  count: { fontFamily: fonts.display, fontSize: 18, color: palettes.dark.ink, minWidth: 56, textAlign: 'center' },
});
