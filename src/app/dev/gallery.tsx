import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ABILITIES, content } from '@/content';
import { AbilityMedallion } from '@/ui/AbilityMedallion';
import { CardCarousel } from '@/ui/CardCarousel';
import { ClassCard } from '@/ui/cards/ClassCard';
import { RaceCard } from '@/ui/cards/RaceCard';
import { Pips } from '@/ui/Pips';
import { classColors, fonts, palettes, space } from '@/ui/theme';

// Dev-only screen: every visual component with real data, to check on a phone.
export default function Gallery() {
  const [slots, setSlots] = useState(1);
  const [ki, setKi] = useState(0);
  const scores = [15, 14, 13, 12, 10, 8];

  return (
    <ScrollView style={{ backgroundColor: palettes.dark.table }} contentContainerStyle={{ paddingBottom: 48 }}>
      <Stack.Screen options={{ title: 'Component Gallery' }} />

      <Text style={styles.heading}>Races: swipe, tap to flip</Text>
      <CardCarousel
        items={content.races.all}
        keyOf={(r) => r.index}
        renderCard={(race, width) => <RaceCard race={race} width={width} />}
      />

      <Text style={styles.heading}>Classes</Text>
      <CardCarousel
        items={content.classes.all}
        keyOf={(c) => c.index}
        renderCard={(cls, width) => <ClassCard cls={cls} width={width} />}
      />

      <Text style={styles.heading}>Ability medallions</Text>
      <View style={styles.medallions}>
        {ABILITIES.map((a, i) => (
          <AbilityMedallion key={a} ability={a} score={i === 5 ? undefined : scores[i]} bonus={a === 'con' ? 2 : undefined} color={classColors.fighter} />
        ))}
      </View>

      <Text style={styles.heading}>Pips (tap them)</Text>
      <View style={styles.pipsBlock}>
        <Text style={styles.label}>1st-level slots</Text>
        <Pips max={4} spent={slots} color={classColors.wizard} label="1st-level slots" onChange={setSlots} />
        <Text style={styles.label}>Ki</Text>
        <Pips max={5} spent={ki} color={classColors.monk} label="Ki" onChange={setKi} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.display, fontSize: 22, color: palettes.dark.ink, marginTop: space.xl, marginHorizontal: space.lg },
  medallions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, rowGap: space.xl, padding: space.lg, justifyContent: 'center' },
  pipsBlock: { padding: space.lg, gap: space.sm },
  label: { fontFamily: fonts.body, color: palettes.dark.inkMuted, marginTop: space.sm },
});
