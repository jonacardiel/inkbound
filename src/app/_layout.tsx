import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import { OldStandardTT_400Regular, OldStandardTT_700Bold } from '@expo-google-fonts/old-standard-tt';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { registerOffline } from '@/state/offline';
import { fonts, usePalette } from '@/ui/theme';

SplashScreen.preventAutoHideAsync();
registerOffline();

export default function RootLayout() {
  const palette = usePalette();
  const [loaded] = useFonts({
    OldStandardTT_400Regular,
    OldStandardTT_700Bold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.table }}>
      <StatusBar style={palette.table === '#16120F' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.table },
          headerTintColor: palette.ink,
          headerTitleStyle: { fontFamily: fonts.display },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.table },
        }}>
        <Stack.Screen name="create" options={{ headerShown: false }} />
        <Stack.Screen name="character/[id]" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
