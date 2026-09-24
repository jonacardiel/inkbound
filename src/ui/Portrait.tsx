import { Image } from 'expo-image';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ArtImage } from '@/ui/ArtImage';
import { fonts, palettes, space } from '@/ui/theme';

/**
 * A character portrait is either a built-in engraving ("art:<race>-<n>") or a
 * photo URI (a file in the app's documents on native, a data URI on web).
 */
export function Portrait({ portrait, race, name, color, style }: { portrait?: string; race: string; name: string; color: string; style?: StyleProp<ViewStyle> }) {
  if (portrait && !portrait.startsWith('art:')) {
    return <Image source={{ uri: portrait }} contentFit="cover" accessibilityLabel={`Portrait of ${name}`} style={[{ aspectRatio: 3 / 4 }, style as object]} />;
  }
  const id = portrait ? portrait.slice(4) : `${race}-1`;
  return <ArtImage kind="portraits" id={id} name={name} color={color} style={style} />;
}

/** Lets the player pick a race-matched engraving or their own photo. */
export function PortraitPicker({ race, value, onChange, color }: { race: string; value?: string; onChange: (portrait: string) => void; color: string }) {
  const options = [1, 2, 3, 4].map((n) => `art:${race}-${n}`);
  const isPhoto = value && !value.startsWith('art:');

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.6,
      // Web can't keep files, so the photo is stored inline.
      base64: Platform.OS === 'web',
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (Platform.OS === 'web') {
      onChange(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      return;
    }
    // The picker's file is temporary; copy it somewhere permanent.
    const dest = new File(Paths.document, `portrait-${Date.now()}.jpg`);
    new File(asset.uri).copy(dest);
    onChange(dest.uri);
  };

  return (
    <View style={styles.row}>
      {options.map((id, i) => (
        <Pressable
          key={id}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === id || (!value && i === 0) }}
          accessibilityLabel={`Portrait ${i + 1}`}
          onPress={() => onChange(id)}
          style={[styles.option, { borderColor: value === id || (!value && i === 0) ? color : palettes.dark.rule }]}>
          <Portrait portrait={id} race={race} name={`Portrait ${i + 1}`} color={color} style={styles.image} />
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use your own photo"
        onPress={pickPhoto}
        style={[styles.option, styles.photo, { borderColor: isPhoto ? color : palettes.dark.rule }]}>
        {isPhoto ? (
          <Portrait portrait={value} race={race} name="Your photo" color={color} style={styles.image} />
        ) : (
          <Text style={styles.photoText}>Your photo</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  option: { width: '18.5%', minWidth: 58, aspectRatio: 3 / 4, borderWidth: 2, borderRadius: 6, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  photo: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  photoText: { fontFamily: fonts.bodyBold, fontSize: 11, color: palettes.dark.inkMuted, textAlign: 'center' },
});
