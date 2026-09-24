import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { Bio } from '@/rules/character';
import { TabBody } from '@/sheet/parts';
import { useSheet } from '@/sheet/useSheet';
import { fonts, palettes, space } from '@/ui/theme';

const FIELDS: { key: keyof Bio; label: string; lines: number }[] = [
  { key: 'notes', label: 'Session notes', lines: 8 },
  { key: 'traits', label: 'Personality', lines: 3 },
  { key: 'ideals', label: 'Ideals', lines: 2 },
  { key: 'bonds', label: 'Bonds', lines: 2 },
  { key: 'flaws', label: 'Flaws', lines: 2 },
  { key: 'appearance', label: 'Appearance', lines: 3 },
];

export default function Notes() {
  const { character, update } = useSheet()!;
  return (
    <TabBody>
      {FIELDS.map((f) => (
        <View key={f.key} style={{ gap: space.sm }}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            value={character.bio[f.key] ?? ''}
            onChangeText={(v) => update((c) => ({ ...c, bio: { ...c.bio, [f.key]: v } }))}
            multiline
            accessibilityLabel={f.label}
            placeholderTextColor={palettes.dark.inkMuted}
            placeholder={f.key === 'notes' ? 'NPC names, loot, the thing the innkeeper mentioned…' : undefined}
            style={[styles.input, { minHeight: 22 * f.lines + 16 }]}
          />
        </View>
      ))}
    </TabBody>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.3, color: palettes.dark.inkMuted, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: palettes.dark.rule,
    borderRadius: 6,
    padding: space.md,
    color: palettes.dark.ink,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: '#1F1914',
    textAlignVertical: 'top',
  },
});
