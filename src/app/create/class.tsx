import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { content } from '@/content';
import { classMeta } from '@/content/meta/classes';
import { PickFromCarousel } from '@/creator/PickFromCarousel';
import { quickBuild } from '@/creator/quickBuild';
import { StepChoices } from '@/creator/StepChoices';
import { StepScreen } from '@/creator/StepScreen';
import { useCreator } from '@/creator/useCreator';
import { ClassCard } from '@/ui/cards/ClassCard';
import { fonts, palettes } from '@/ui/theme';

export default function ClassStep() {
  const { draft, setClass, set, color } = useCreator();
  const race = draft.race ? content.races.find(draft.race) : undefined;
  const cls = draft.classId ? content.classes.find(draft.classId) : undefined;
  // "Pairs with your race" when the race boosts the class's primary ability.
  const pairs =
    race && cls && classMeta[cls.index].primary.some((a) => race.abilityBonuses.some((b) => b.abilityScore === a));

  return (
    <StepScreen
      step="class"
      title="Choose your class"
      subtitle="Your class is what you do in a fight, and how you solve problems outside one."
      nextDisabled={!draft.classId}
      fullBleed={
        <PickFromCarousel
          items={content.classes.all}
          selectedId={draft.classId}
          onSelect={(c) => setClass(c.index)}
          color={color}
          renderCard={(c, width, selected) => <ClassCard cls={c} width={width} selected={selected} />}
        />
      }>
      {pairs ? (
        <Text style={{ fontFamily: fonts.body, color: palettes.dark.inkMuted, textAlign: 'center' }}>
          {`★ ${race!.name} bonuses boost the ${cls!.name}'s key ability.`}
        </Text>
      ) : null}
      <StepChoices step="class" />
      {draft.race && draft.classId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Fills in ability scores, skills, gear and spells with recommended picks"
          onPress={() => {
            set(quickBuild(draft));
            router.push('/create/details');
          }}
          style={({ pressed }) => ({
            minHeight: 48,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: color,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color }}>Quick Build: fill in the rest for me</Text>
        </Pressable>
      ) : null}
    </StepScreen>
  );
}
