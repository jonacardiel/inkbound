import { useEffect } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { useDiceSettings, useRolls } from '@/sheet/rolls';

import RollStageCanvas from './RollStageCanvas';
import { preloadDiceSounds } from './sounds';
import { StageBoundary } from './StageBoundary';

/** Plays staged rolls on the 3D dice stage (native). With Reduce Motion on, rolls go straight to the toast. */
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
      <RollStageCanvas roll={staged} color={color} onDone={finishStage} />
    </StageBoundary>
  );
}
