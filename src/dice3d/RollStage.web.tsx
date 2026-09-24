import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { useEffect } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { useDiceSettings, useRolls } from '@/sheet/rolls';

import { preloadDiceSounds } from './sounds';
import { StageBoundary } from './StageBoundary';

/**
 * Web version: Skia's WebAssembly engine (public/canvaskit.wasm) is loaded the
 * first time a roll is staged, so it never slows down the rest of the app.
 */
export function RollStage({ color }: { color: string }) {
  const staged = useRolls((s) => s.staged);
  const finishStage = useRolls((s) => s.finishStage);
  const reduceMotion = useReducedMotion();
  const sound = useDiceSettings((s) => s.sound);

  useEffect(() => {
    if (sound) preloadDiceSounds();
  }, [sound]);

  useEffect(() => {
    if (staged && reduceMotion) finishStage();
  }, [staged, reduceMotion, finishStage]);

  if (!staged || reduceMotion) return null;
  return (
    <StageBoundary key={staged.at} onFail={finishStage}>
      <WithSkiaWeb
        opts={{ locateFile: (file) => `${process.env.EXPO_PUBLIC_BASE_URL ?? ""}/${file}` }}
        getComponent={() => import('./RollStageCanvas')}
        componentProps={{ roll: staged, color, onDone: finishStage }}
      />
    </StageBoundary>
  );
}
