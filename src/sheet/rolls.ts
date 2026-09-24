import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { roll, type Mode, type RollResult } from '@/rules/dice';

type RollState = {
  log: RollResult[];
  /** The roll currently shown in the result toast. */
  latest?: RollResult;
  mode: Mode;
  setMode: (mode: Mode) => void;
  dismiss: () => void;
  roll: (expression: string, label: string, opts?: { mode?: Mode; critical?: boolean }) => RollResult;
};

/** Session roll log (not persisted). Advantage/disadvantage is a sticky toggle in the dice tray. */
export const useRolls = create<RollState>()((set, get) => ({
  log: [],
  mode: 'normal',
  setMode: (mode) => set({ mode }),
  dismiss: () => set({ latest: undefined }),
  roll: (expression, label, opts = {}) => {
    const result = roll(expression, { label, mode: opts.mode ?? get().mode, critical: opts.critical });
    set((s) => ({ latest: result, log: [result, ...s.log].slice(0, 50) }));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(result.crit ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
    }
    return result;
  },
}));
