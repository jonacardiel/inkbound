import { StepChoices } from '@/creator/StepChoices';
import { StepScreen } from '@/creator/StepScreen';
import { useCreator } from '@/creator/useCreator';

export default function SkillsStep() {
  const { sheet, draft } = useCreator();
  // Skills granted by race or background (not picked here) show as locked.
  const picked = new Set(Object.values(draft.choices).flat());
  const locked = new Set([...(sheet?.proficiencies ?? [])].filter((p) => p.startsWith('skill-') && !picked.has(p)));

  return (
    <StepScreen step="skills" title="Skills" subtitle="What you're trained in. Skills you already have from your race or background are marked.">
      <StepChoices step="skills" locked={locked} />
    </StepScreen>
  );
}
