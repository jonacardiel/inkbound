import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { isSides } from '@/dice3d/polyhedra';
import { roll, type Mode, type RollResult } from '@/rules/dice';
import { persistStorage } from '@/state/storage';

/** Full: cinematic 3D dice. Quick: the result toast with a short number tumble. Off: just the result. */
export type DiceAnimation = 'full' | 'quick' | 'off';

type DiceSettings = {
  animation: DiceAnimation;
  sound: boolean;
  setAnimation: (a: DiceAnimation) => void;
  setSound: (on: boolean) => void;
};

export const useDiceSettings = create<DiceSettings>()(
  persist(
    (set) => ({
      animation: 'full',
      sound: true,
      setAnimation: (animation) => set({ animation }),
      setSound: (sound) => set({ sound }),
    }),
    {
      name: 'dice-settings',
      storage: persistStorage,
      version: 1,
    },
  ),
);

type RollState = {
  log: RollResult[];
  /** The roll currently shown in the result toast. */
  latest?: RollResult;
  /** A roll playing on the 3D dice stage; it moves to `latest` when the stage finishes. */
  staged?: RollResult;
  mode: Mode;
  /** Development only: the next d20 lands on this face (to test crits). */
  forceNextD20?: number;
  setMode: (mode: Mode) => void;
  setForceNextD20: (face?: number) => void;
  dismiss: () => void;
  finishStage: () => void;
  roll: (expression: string, label: string, opts?: { mode?: Mode; critical?: boolean }) => RollResult;
};

/** True when a roll has real dice the 3D stage can show (d4-d20; not flat numbers or d100). */
export const canStage = (r: RollResult) => r.dice.length > 0 && r.dice.every((d) => isSides(d.sides));

/** Session roll log (not persisted). Advantage/disadvantage is a sticky toggle in the dice tray. */
export const useRolls = create<RollState>()((set, get) => ({
  log: [],
  mode: 'normal',
  setMode: (mode) => set({ mode }),
  setForceNextD20: (forceNextD20) => set({ forceNextD20 }),
  dismiss: () => set({ latest: undefined }),
  finishStage: () => {
    const staged = get().staged;
    if (staged) set({ staged: undefined, latest: staged, log: [staged, ...get().log].slice(0, 50) });
  },
  roll: (expression, label, opts = {}) => {
    const forced = __DEV__ && /d20/.test(expression) ? get().forceNextD20 : undefined;
    const rng = forced ? () => (forced - 1) / 20 + 1e-9 : undefined;
    const result = roll(expression, { label, mode: opts.mode ?? get().mode, critical: opts.critical, rng });
    if (forced) set({ forceNextD20: undefined });

    if (useDiceSettings.getState().animation === 'full' && canStage(result)) {
      // The stage plays the throw, then hands the result to the toast and log.
      set({ staged: result, latest: undefined });
    } else {
      set((s) => ({ latest: result, log: [result, ...s.log].slice(0, 50) }));
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(result.crit ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
      }
    }
    return result;
  },
}));
