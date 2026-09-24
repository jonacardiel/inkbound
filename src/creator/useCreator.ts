import { useMemo } from 'react';

import { allChoices, pendingChoices, type Choice, type CreatorStep } from '@/rules/choices';
import { withStartingGear } from '@/rules/creation';
import { derive, type Sheet } from '@/rules/derive';
import { draftToCharacter, useDraft } from '@/state/draft';
import { classColors, palettes } from '@/ui/theme';

export type StepId = CreatorStep | 'details' | 'review';

export const STEPS: { id: StepId; title: string }[] = [
  { id: 'race', title: 'Race' },
  { id: 'class', title: 'Class' },
  { id: 'abilities', title: 'Abilities' },
  { id: 'background', title: 'Background' },
  { id: 'skills', title: 'Skills' },
  { id: 'equipment', title: 'Gear' },
  { id: 'spells', title: 'Spells' },
  { id: 'details', title: 'Details' },
  { id: 'review', title: 'Review' },
];

/** Everything a creator screen needs: the draft, its preview sheet, and choices per step. */
export function useCreator() {
  const store = useDraft();
  const { draft } = store;

  return useMemo(() => {
    const character = draftToCharacter(draft);
    // Preview with the chosen starting gear, so AC and attacks update as armor is picked.
    const sheet: Sheet | undefined = character ? derive(withStartingGear(character)) : undefined;
    // Race and background picks are available before a class is chosen.
    const forChoices = character ?? draftToCharacter(draft, 'draft', true);
    const choices: Choice[] = forChoices ? allChoices(forChoices, { includeEquipment: true }) : [];
    const pending: Choice[] = forChoices ? pendingChoices(forChoices, { includeEquipment: true }) : [];
    const color = draft.classId ? classColors[draft.classId] : palettes.dark.accent;
    const scoresComplete = Object.keys(draft.baseScores).length === 6;

    const stepChoices = (step: StepId) => choices.filter((c) => c.step === step);
    const isCaster = choices.some((c) => c.step === 'spells');
    const steps = STEPS.filter((s) => s.id !== 'spells' || isCaster || !character);

    /** A step needs attention when it has unanswered picks (or its core pick is missing). */
    const needsAttention = (step: StepId): boolean => {
      if (step === 'race') return !draft.race || pending.some((c) => c.step === 'race');
      if (step === 'class') return !draft.classId || pending.some((c) => c.step === 'class');
      if (step === 'abilities') return !scoresComplete || pending.some((c) => c.step === 'abilities');
      if (step === 'details') return !draft.name.trim();
      if (step === 'review') return false;
      return pending.some((c) => c.step === step);
    };

    return { ...store, character, sheet, choices, pending, color, steps, stepChoices, needsAttention, scoresComplete };
  }, [draft, store]);
}
