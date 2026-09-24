import { content } from '@/content';
import { PickFromCarousel } from '@/creator/PickFromCarousel';
import { StepChoices } from '@/creator/StepChoices';
import { StepScreen } from '@/creator/StepScreen';
import { useCreator } from '@/creator/useCreator';
import { RaceCard } from '@/ui/cards/RaceCard';

export default function RaceStep() {
  const { draft, setRace, color } = useCreator();

  return (
    <StepScreen
      step="race"
      title="Choose your race"
      subtitle="Your people shape your body, your senses and a few natural talents."
      nextDisabled={!draft.race}
      fullBleed={
        <PickFromCarousel
          items={content.races.all}
          selectedId={draft.race}
          onSelect={(race) => setRace(race.index)}
          color={color}
          renderCard={(race, width, selected) => <RaceCard race={race} width={width} selected={selected} />}
        />
      }>
      <StepChoices step="race" />
    </StepScreen>
  );
}
