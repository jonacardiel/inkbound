import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { content } from '@/content';
import { describe } from '@/content/describe';
import { EXTRA_BACKGROUNDS } from '@/content/extraBackgrounds';
import { StepChoices } from '@/creator/StepChoices';
import { StepScreen } from '@/creator/StepScreen';
import { useCreator } from '@/creator/useCreator';
import { CUSTOM_BACKGROUND } from '@/rules/choices';
import { ArtCard } from '@/ui/ArtCard';
import { fonts, palettes, space } from '@/ui/theme';

const TAGLINES: Record<string, string> = {
  acolyte: 'You grew up in service to a temple: rites, scripture and the respect of the faithful.',
  [CUSTOM_BACKGROUND]: 'Write your own past: pick any two skills and two languages, and name it yourself.',
  ...Object.fromEntries(EXTRA_BACKGROUNDS.map((b) => [b.index, b.tagline])),
};

/** Short chips for a card: its two skills, or "any" for the custom background. */
function chipsFor(id: string): string[] {
  if (id === CUSTOM_BACKGROUND) return ['Any 2 skills'];
  const bg = content.backgrounds.get(id);
  return bg.startingProficiencies.filter((p) => p.startsWith('skill-')).map((p) => describe(p).name);
}

export default function BackgroundStep() {
  const { draft, set, color } = useCreator();
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const cardWidth = (Math.min(width, 640) - space.lg * 2 - space.md * (columns - 1)) / columns;
  const options = [...content.backgrounds.all.map((b) => ({ id: b.index, name: b.name })), { id: CUSTOM_BACKGROUND, name: 'Your Own Story' }];
  const selected = draft.background === CUSTOM_BACKGROUND ? undefined : content.backgrounds.find(draft.background);

  // What the chosen background grants, in plain words.
  const grants = selected
    ? [
        ...selected.startingProficiencies.map((p) => describe(p).name),
        ...(selected.proficiencyChoices ?? []).map((c) => (c.desc ? c.desc[0].toLowerCase() + c.desc.slice(1) : 'a tool')),
        selected.languageOptions ? `${selected.languageOptions.choose} extra language${selected.languageOptions.choose > 1 ? 's' : ''}` : null,
        selected.startingGold ? `${selected.startingGold.quantity} ${selected.startingGold.unit}` : null,
      ].filter(Boolean)
    : [];

  return (
    <StepScreen step="background" title="Background" subtitle="Where you came from before adventure found you. Tap a card to choose it.">
      <View style={styles.grid}>
        {options.map((o) => (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: draft.background === o.id }}
            accessibilityLabel={`${o.name}. ${TAGLINES[o.id] ?? ''}`}
            onPress={() => set({ background: o.id })}>
            <ArtCard kind="backgrounds" id={o.id} name={o.name} chips={chipsFor(o.id)} color={color} width={cardWidth} selected={draft.background === o.id} />
          </Pressable>
        ))}
      </View>

      <View style={[styles.details, { borderColor: color }]}>
        <Text style={styles.detailsTitle}>{selected?.name ?? 'Your Own Story'}</Text>
        <Text style={styles.tagline}>{TAGLINES[draft.background]}</Text>
        {selected ? (
          <>
            <Text style={styles.grants}>{`You gain: ${grants.join(', ')}.`}</Text>
            <Text style={styles.featureName}>{selected.feature.name}</Text>
            {selected.feature.desc.map((d) => (
              <Text key={d} style={styles.featureText}>
                {d}
              </Text>
            ))}
          </>
        ) : null}
      </View>

      <StepChoices step="background" />
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  details: { borderWidth: 1.5, borderRadius: 10, padding: space.lg, gap: space.sm },
  detailsTitle: { fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink },
  tagline: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: palettes.dark.ink },
  grants: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 20, color: palettes.dark.inkMuted },
  featureName: { fontFamily: fonts.display, fontSize: 18, color: palettes.dark.ink, marginTop: space.sm },
  featureText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: palettes.dark.inkMuted },
});
