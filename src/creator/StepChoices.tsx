import { View } from 'react-native';

import { useCreator, type StepId } from '@/creator/useCreator';
import type { Choice } from '@/rules/choices';
import { ChoicePicker } from '@/ui/ChoicePicker';
import { space } from '@/ui/theme';

/**
 * Renders every choice belonging to a step. `subrace` and `subclass` live on
 * the draft itself rather than in `choices`, so they are mapped here.
 */
export function StepChoices({ step, filter, locked }: { step: StepId; filter?: (c: Choice) => boolean; locked?: Set<string> }) {
  const { draft, stepChoices, setChoice, set, color } = useCreator();
  const list = stepChoices(step).filter(filter ?? (() => true));
  if (!list.length) return null;

  const values: Record<string, string[]> = {
    ...draft.choices,
    subrace: draft.subrace ? [draft.subrace] : [],
    subclass: draft.subclassId ? [draft.subclassId] : [],
  };
  const onChange = (id: string, v: string[]) => {
    if (id === 'subrace') set({ subrace: v[0] });
    else if (id === 'subclass') set({ subclassId: v[0] });
    else setChoice(id, v);
  };

  return (
    <View style={{ gap: space.xxl }}>
      {list.map((choice) => (
        <ChoicePicker key={choice.id} choice={choice} choices={values} onChange={onChange} color={color} locked={locked} />
      ))}
    </View>
  );
}
