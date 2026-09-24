import { useEffect } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { useRolls } from '@/sheet/rolls';

import RollStageCanvas from './RollStageCanvas';

/** Plays staged rolls on the 3D dice stage (native). With Reduce Motion on, rolls go straight to the toast. */
export function RollStage({ color }: { color: string }) {
  const staged = useRolls((s) => s.staged);
  const finishStage = useRolls((s) => s.finishStage);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (staged && reduceMotion) finishStage();
  }, [staged, reduceMotion, finishStage]);

  if (!staged || reduceMotion) return null;
  return <RollStageCanvas key={staged.at} roll={staged} color={color} onDone={finishStage} />;
}
