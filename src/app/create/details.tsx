import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { content } from '@/content';
import { StepScreen } from '@/creator/StepScreen';
import { useCreator } from '@/creator/useCreator';
import type { Bio } from '@/rules/character';
import { fonts, palettes, space } from '@/ui/theme';

const ALIGNMENT_GRID = [
  ['lawful-good', 'neutral-good', 'chaotic-good'],
  ['lawful-neutral', 'neutral', 'chaotic-neutral'],
  ['lawful-evil', 'neutral-evil', 'chaotic-evil'],
];

const BIO_FIELDS: { key: keyof Bio; label: string; placeholder: string }[] = [
  { key: 'traits', label: 'Personality', placeholder: 'I quote scripture at the worst possible moments.' },
  { key: 'ideals', label: 'Ideals', placeholder: 'What do you believe in?' },
  { key: 'bonds', label: 'Bonds', placeholder: 'Who or what would you die for?' },
  { key: 'flaws', label: 'Flaws', placeholder: "What's your weakness?" },
  { key: 'appearance', label: 'Appearance', placeholder: 'Scarred knuckles, a braid threaded with silver rings…' },
];

export default function DetailsStep() {
  const { draft, set, color } = useCreator();
  const setBio = (key: keyof Bio, value: string) => set({ bio: { ...draft.bio, [key]: value } });

  return (
    <StepScreen step="details" title="Who are you?" subtitle="A name is required; everything else can be filled in later.">
      <View style={{ gap: space.sm }}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={draft.name}
          onChangeText={(name) => set({ name })}
          placeholder="Name your hero"
          placeholderTextColor={palettes.dark.inkMuted}
          style={[styles.input, styles.name, { borderColor: draft.name.trim() ? color : palettes.dark.rule }]}
          autoCapitalize="words"
          accessibilityLabel="Character name"
        />
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={styles.label}>Alignment</Text>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {ALIGNMENT_GRID.flat().map((id) => {
            const selected = draft.bio.alignment === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => set({ bio: { ...draft.bio, alignment: selected ? undefined : id } })}
                style={[styles.cell, { borderColor: selected ? color : palettes.dark.rule }, selected && { backgroundColor: color }]}>
                <Text style={[styles.cellText, { color: selected ? palettes.dark.table : palettes.dark.ink }]}>
                  {content.alignments.get(id).name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {BIO_FIELDS.map((f) => (
        <View key={f.key} style={{ gap: space.sm }}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            value={draft.bio[f.key] ?? ''}
            onChangeText={(v) => setBio(f.key, v)}
            placeholder={f.placeholder}
            placeholderTextColor={palettes.dark.inkMuted}
            multiline
            style={[styles.input, { minHeight: 64 }]}
            accessibilityLabel={f.label}
          />
        </View>
      ))}
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.3, color: palettes.dark.inkMuted, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: palettes.dark.rule,
    borderRadius: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: palettes.dark.ink,
    fontFamily: fonts.body,
    fontSize: 16,
    backgroundColor: '#1F1914',
    textAlignVertical: 'top',
  },
  name: { fontFamily: fonts.display, fontSize: 24, minHeight: 52 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { width: '31.5%', minHeight: 56, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  cellText: { fontFamily: fonts.bodyBold, fontSize: 13, textAlign: 'center' },
});
