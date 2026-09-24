import { StepChoices } from '@/creator/StepChoices';
import { StepScreen } from '@/creator/StepScreen';

export default function EquipmentStep() {
  return (
    <StepScreen step="equipment" title="Starting gear" subtitle="Pick one option from each pair. Your armor class and attacks update in the bar below.">
      <StepChoices step="equipment" />
    </StepScreen>
  );
}
