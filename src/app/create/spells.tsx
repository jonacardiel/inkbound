import { StepChoices } from '@/creator/StepChoices';
import { StepScreen } from '@/creator/StepScreen';
import { useCreator } from '@/creator/useCreator';

export default function SpellsStep() {
  const { sheet } = useCreator();
  const sc = sheet?.spellcasting;
  const subtitle = sc
    ? `You cast with ${sc.ability.toUpperCase()}: spell save DC ${sc.saveDc}, spell attack +${sc.attackBonus}.`
    : 'Your class has no spells at 1st level.';

  return (
    <StepScreen step="spells" title="Spells" subtitle={subtitle}>
      <StepChoices step="spells" />
    </StepScreen>
  );
}
