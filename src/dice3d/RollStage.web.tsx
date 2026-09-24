import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { useEffect } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { useRolls } from '@/sheet/rolls';

/**
 * Web version: Skia's WebAssembly engine (public/canvaskit.wasm) is loaded the
 * first time a roll is staged, so it never slows down the rest of the app.
 */
export function RollStage({ color }: { color: string }) {
  const staged = useRolls((s) => s.staged);
  const finishStage = useRolls((s) => s.finishStage);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (staged && reduceMotion) finishStage();
  }, [staged, reduceMotion, finishStage]);

  if (!staged || reduceMotion) return null;
  return (
    <WithSkiaWeb
      key={staged.at}
      opts={{ locateFile: (file) => `/${file}` }}
      getComponent={() => import('./RollStageCanvas')}
      componentProps={{ roll: staged, color, onDone: finishStage }}
    />
  );
}
