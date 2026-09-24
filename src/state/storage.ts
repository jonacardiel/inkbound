import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** AsyncStorage works in Expo Go and falls back to localStorage on web. */
export const persistStorage = createJSONStorage(() => AsyncStorage);
