import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, palettes, space, usePalette } from '@/ui/theme';

// Roster: will become a grid of hero cards once characters exist (M4).
export default function RosterScreen() {
  const palette = usePalette();

  return (
    <View style={[styles.screen, { backgroundColor: palette.table }]}>
      <Stack.Screen options={{ title: 'Your Party' }} />
      <View style={[styles.empty, { backgroundColor: palette.page, borderColor: palette.rule }]}>
        <View style={[styles.innerRule, { borderColor: palette.pageInk }]}>
          <Text style={[styles.title, { color: palette.pageInk }]}>No heroes yet</Text>
          <Text style={[styles.body, { color: palette.pageInk }]}>
            Every legend begins with a blank page.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: palette.pageInk, opacity: pressed ? 0.8 : 1 },
            ]}>
            <Text style={[styles.buttonText, { color: palette.page }]}>Forge a Hero</Text>
          </Pressable>
        </View>
      </View>
      {__DEV__ ? (
        <Link href="/dev/gallery" style={[styles.devLink, { color: palettes.dark.inkMuted }]}>
          Component gallery (dev)
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: space.lg, justifyContent: 'center' },
  empty: { borderWidth: 1, borderRadius: 6, padding: space.sm },
  innerRule: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 3,
    padding: space.xl,
    alignItems: 'center',
    gap: space.md,
  },
  title: { fontFamily: fonts.display, fontSize: 28 },
  body: { fontFamily: fonts.body, fontSize: 16, textAlign: 'center' },
  button: { marginTop: space.sm, paddingVertical: space.md, paddingHorizontal: space.xl, borderRadius: 4, minHeight: 44 },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: 0.5 },
  devLink: { marginTop: space.xl, textAlign: 'center', fontFamily: fonts.body, textDecorationLine: 'underline' },
});
