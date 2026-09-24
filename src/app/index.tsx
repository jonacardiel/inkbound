import { Link, router, Stack, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { content } from '@/content';
import { derive } from '@/rules/derive';
import { useCharacters, useCharactersHydrated } from '@/state/characters';
import { useDraft } from '@/state/draft';
import { ArtCard } from '@/ui/ArtCard';
import { HeroActions } from '@/ui/HeroActions';
import { classColors, fonts, palettes, space, usePalette } from '@/ui/theme';

export default function RosterScreen() {
  const palette = usePalette();
  const characters = Object.values(useCharacters((s) => s.characters));
  const draftInProgress = useDraft((s) => Boolean(s.draft.race || s.draft.classId));
  const hydrated = useCharactersHydrated();
  const [menuFor, setMenuFor] = useState<string>();
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 3 : 2;
  const cardWidth = (Math.min(width, 960) - space.lg * (columns + 1)) / columns;

  const forge = (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/create/race')}
      style={({ pressed }) => [styles.button, { backgroundColor: palettes.dark.accent, opacity: pressed ? 0.8 : 1 }]}>
      <Text style={[styles.buttonText, { color: palettes.dark.table }]}>{draftInProgress ? 'Continue your hero' : 'Forge a Hero'}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ backgroundColor: palette.table }} contentContainerStyle={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Your Party',
          headerRight: () => (
            <Link href="/settings" accessibilityLabel="Settings and backups" style={[styles.headerLink, { color: palette.inkMuted }]}>
              Settings
            </Link>
          ),
        }}
      />

      {!hydrated ? null : characters.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: palette.page, borderColor: palette.rule }]}>
          <View style={[styles.innerRule, { borderColor: palette.pageInk }]}>
            <Text style={[styles.title, { color: palette.pageInk }]}>No heroes yet</Text>
            <Text style={[styles.body, { color: palette.pageInk }]}>Every legend begins with a blank page.</Text>
            {forge}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            {characters.map((c) => {
              const entry = c.classes[0];
              const cls = content.classes.get(entry.classId);
              const race = c.subrace ? content.subraces.get(c.subrace) : content.races.get(c.race);
              const sheet = derive(c);
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name}, level ${entry.level} ${race.name} ${cls.name}. Opens the character sheet.`}
                  accessibilityHint="Long-press for duplicate, backup and delete"
                  onPress={() => router.push(`/character/${c.id}` as Href)}
                  onLongPress={() => setMenuFor(c.id)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                  <ArtCard
                    kind="classes"
                    id={cls.index}
                    name={c.name}
                    tagline={`${race.name} ${cls.name} · Level ${entry.level}`}
                    chips={[`HP ${sheet.maxHp - c.play.damage}/${sheet.maxHp}`, `AC ${sheet.ac}`]}
                    color={classColors[cls.index]}
                    width={cardWidth}
                  />
                </Pressable>
              );
            })}
          </View>
          {forge}
        </>
      )}

      {characters.length ? <Text style={[styles.hint, { color: palette.inkMuted }]}>Long-press a hero to duplicate, back up or delete them.</Text> : null}
      <HeroActions
        character={characters.find((c) => c.id === menuFor)}
        color={menuFor ? classColors[characters.find((c) => c.id === menuFor)?.classes[0].classId ?? ''] ?? palettes.dark.accent : palettes.dark.accent}
        onClose={() => setMenuFor(undefined)}
      />

      {__DEV__ ? (
        <Link href="/dev/gallery" style={[styles.devLink, { color: palettes.dark.inkMuted }]}>
          Component gallery (dev)
        </Link>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, gap: space.lg, flexGrow: 1, justifyContent: 'center', maxWidth: 960, width: '100%', alignSelf: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  empty: { borderWidth: 1, borderRadius: 6, padding: space.sm },
  innerRule: { borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 3, padding: space.xl, alignItems: 'center', gap: space.md },
  title: { fontFamily: fonts.display, fontSize: 28 },
  body: { fontFamily: fonts.body, fontSize: 16, textAlign: 'center' },
  button: { marginTop: space.sm, paddingVertical: space.md, paddingHorizontal: space.xl, borderRadius: 4, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: 0.5 },
  headerLink: { fontFamily: fonts.bodyBold, fontSize: 15, paddingHorizontal: space.md },
  hint: { fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
  devLink: { marginTop: space.xl, textAlign: 'center', fontFamily: fonts.body, textDecorationLine: 'underline' },
});
