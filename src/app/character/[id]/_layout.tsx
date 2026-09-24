import { useKeepAwake } from 'expo-keep-awake';
import { router, Stack, useGlobalSearchParams, usePathname, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { content } from '@/content';
import { DiceTray } from '@/sheet/DiceTray';
import { HpPanel } from '@/sheet/HpPanel';
import { RollToast } from '@/sheet/RollToast';
import { useSheet } from '@/sheet/useSheet';
import { signedNumber } from '@/ui/AbilityMedallion';
import { Portrait } from '@/ui/Portrait';
import { fonts, palettes, space } from '@/ui/theme';

const TABS = [
  { route: '', title: 'Overview' },
  { route: 'skills', title: 'Skills' },
  { route: 'combat', title: 'Combat' },
  { route: 'spells', title: 'Spells' },
  { route: 'gear', title: 'Gear' },
  { route: 'features', title: 'Features' },
  { route: 'notes', title: 'Notes' },
];

export default function SheetLayout() {
  // Keep the screen on while the sheet is open at the table.
  useKeepAwake();
  const s = useSheet();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { id } = useGlobalSearchParams<{ id: string }>();

  if (!s) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.name}>Character not found</Text>
      </View>
    );
  }
  const { character, sheet, color } = s;
  const entry = character.classes[0];
  const race = character.subrace ? content.subraces.get(character.subrace) : content.races.get(character.race);
  const current = pathname.split('/')[3] ?? '';
  const tabs = TABS.filter((t) => t.route !== 'spells' || sheet.spellcasting);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm, borderBottomColor: color }]}>
        <View style={styles.headerTop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to your party" onPress={() => router.dismissTo('/')} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Portrait portrait={character.portrait} race={character.race} name={character.name} color={color} style={[styles.portrait, { borderColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {character.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {`${race.name} ${content.classes.get(entry.classId).name} ${entry.level}`}
              {entry.subclassId ? ` · ${content.subclasses.get(entry.subclassId).name}` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.headerStats}>
          <HpPanel />
          <HeaderStat label="AC" value={sheet.ac} />
          <HeaderStat label="Speed" value={sheet.speed} />
          <HeaderStat label="Init" value={signedNumber(sheet.initiative)} />
        </View>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((t) => {
            const active = t.route === current;
            return (
              <Pressable
                key={t.title}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => router.replace(`/character/${id}${t.route ? `/${t.route}` : ''}` as Href)}
                style={[styles.tab, active && { borderBottomColor: color }]}>
                <Text style={[styles.tabText, { color: active ? palettes.dark.ink : palettes.dark.inkMuted }]}>{t.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: palettes.dark.table } }} />
      </View>
      <RollToast color={color} />
      <DiceTray color={color} />
    </View>
  );
}

function HeaderStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.headerStat} accessible accessibilityLabel={`${label} ${value}`}>
      <Text style={styles.headerStatValue}>{value}</Text>
      <Text style={styles.headerStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palettes.dark.table },
  header: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.md, borderBottomWidth: 2, backgroundColor: '#100D0B' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  back: { fontSize: 32, lineHeight: 34, color: palettes.dark.inkMuted, paddingRight: 4 },
  portrait: { width: 48, height: 64, borderRadius: 6, borderWidth: 1.5, overflow: 'hidden' },
  name: { fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink },
  sub: { fontFamily: fonts.body, fontSize: 14, color: palettes.dark.inkMuted },
  headerStats: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headerStat: { alignItems: 'center', minWidth: 48 },
  headerStatValue: { fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  headerStatLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.2, color: palettes.dark.inkMuted, textTransform: 'uppercase' },
  tabs: { paddingHorizontal: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule },
  tab: { paddingHorizontal: space.md, paddingVertical: space.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontFamily: fonts.bodyBold, fontSize: 14 },
});
