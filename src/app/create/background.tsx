import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { content } from '@/content';
import { StepChoices } from '@/creator/StepChoices';
import { StepScreen } from '@/creator/StepScreen';
import { useCreator } from '@/creator/useCreator';
import { CUSTOM_BACKGROUND } from '@/rules/choices';
import { ArtCard } from '@/ui/ArtCard';
import { fonts, palettes, space } from '@/ui/theme';

const OPTIONS = [
  {
    id: 'acolyte',
    name: 'Acolyte',
    tagline: 'You grew up in service to a temple: rites, scripture and the respect of the faithful.',
    chips: ['Insight', 'Religion', '2 languages'],
  },
  {
    id: CUSTOM_BACKGROUND,
    name: 'Your Own Story',
    tagline: 'Soldier, sailor, street urchin? Write your own past: pick any two skills and two languages.',
    chips: ['Any 2 skills', 'Any 2 languages'],
  },
];

export default function BackgroundStep() {
  const { draft, set, color } = useCreator();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(300, (Math.min(width, 640) - space.lg * 3) / 2);
  const acolyte = content.backgrounds.get('acolyte');

  return (
    <StepScreen step="background" title="Background" subtitle="Where you came from before adventure found you.">
      <View style={styles.row}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: draft.background === o.id }}
            accessibilityLabel={`${o.name}. ${o.tagline}`}
            onPress={() => set({ background: o.id })}>
            <ArtCard kind="backgrounds" id={o.id} name={o.name} chips={o.chips} color={color} width={cardWidth} selected={draft.background === o.id} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.tagline}>{OPTIONS.find((o) => o.id === draft.background)?.tagline}</Text>
      {draft.background === 'acolyte' ? (
        <View style={styles.feature}>
          <Text style={styles.featureName}>{acolyte.feature.name}</Text>
          <Text style={styles.featureText}>{acolyte.feature.desc[0]}</Text>
        </View>
      ) : null}
      <StepChoices step="background" />
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: space.lg },
  tagline: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: palettes.dark.ink, textAlign: 'center' },
  feature: { borderLeftWidth: 2, borderLeftColor: palettes.dark.rule, paddingLeft: space.md, gap: 4 },
  featureName: { fontFamily: fonts.display, fontSize: 18, color: palettes.dark.ink },
  featureText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: palettes.dark.inkMuted },
});
