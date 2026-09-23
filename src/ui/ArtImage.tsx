import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { artManifest, type ArtKind } from '@/content/art/manifest';
import { fonts, palettes } from '@/ui/theme';

type Props = {
  kind: ArtKind;
  id: string;
  /** Name used for the placeholder monogram. */
  name: string;
  /** Spot color for the placeholder (class, race or school color). */
  color?: string;
  aspect?: '3:4' | '1:1';
  style?: StyleProp<ViewStyle>;
};

/**
 * Shows approved art from the manifest, or an ink-and-paper placeholder:
 * a paper tile with the entity's monogram in its spot color. Art never blocks
 * development.
 */
export function ArtImage({ kind, id, name, color = palettes.dark.accent, aspect = '3:4', style }: Props) {
  const art = artManifest[kind]?.[id];
  const aspectRatio = aspect === '3:4' ? 3 / 4 : 1;

  if (art) {
    return (
      <Image
        source={art.source}
        placeholder={{ blurhash: art.blurhash }}
        contentFit="cover"
        transition={200}
        accessibilityLabel={name}
        style={[{ aspectRatio }, style as object]}
      />
    );
  }

  return (
    <View
      accessibilityLabel={name}
      style={[styles.placeholder, { aspectRatio, backgroundColor: palettes.dark.page }, style]}>
      <View style={[styles.frame, { borderColor: palettes.dark.pageInk }]}>
        <Text style={[styles.monogram, { color }]} adjustsFontSizeToFit numberOfLines={1}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { padding: 6, overflow: 'hidden' },
  frame: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: { fontFamily: fonts.display, fontSize: 72 },
});
