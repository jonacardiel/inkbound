import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type { ArtKind } from '@/content/art/manifest';
import { ArtImage } from '@/ui/ArtImage';
import { Chip } from '@/ui/Chip';
import { fonts, palettes } from '@/ui/theme';

type Props = {
  kind: ArtKind;
  id: string;
  name: string;
  tagline?: string;
  chips?: string[];
  /** Spot color: used for the name rule and chips. */
  color: string;
  width: number;
  selected?: boolean;
};

/**
 * The creator's signature card: a 3:4 engraving on an aged-paper page with a
 * double-rule border, and the name set over a dark scrim at the bottom.
 */
export function ArtCard({ kind, id, name, tagline, chips = [], color, width, selected }: Props) {
  const height = (width * 4) / 3;
  return (
    <View
      style={[
        styles.page,
        { width, height, borderColor: selected ? color : palettes.dark.rule, borderWidth: selected ? 2 : 1 },
      ]}>
      <View style={styles.innerRule}>
        <ArtImage kind={kind} id={id} name={name} color={color} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['transparent', 'rgba(22,18,15,0.85)', '#16120F']}
          locations={[0, 0.55, 1]}
          style={styles.scrim}>
          <Text style={styles.name}>{name}</Text>
          <View style={[styles.rule, { backgroundColor: color }]} />
          {tagline ? (
            <Text style={styles.tagline} numberOfLines={2}>
              {tagline}
            </Text>
          ) : null}
          {chips.length ? (
            <View style={styles.chips}>
              {chips.map((c) => (
                <Chip key={c} label={c} />
              ))}
            </View>
          ) : null}
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: palettes.dark.page,
    borderRadius: 8,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  innerRule: {
    flex: 1,
    borderWidth: 1,
    borderColor: palettes.dark.pageInk,
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  scrim: { paddingHorizontal: 16, paddingTop: 64, paddingBottom: 16, gap: 6 },
  name: { fontFamily: fonts.display, fontSize: 30, color: palettes.dark.ink },
  rule: { width: 40, height: 2 },
  tagline: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: palettes.dark.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});
