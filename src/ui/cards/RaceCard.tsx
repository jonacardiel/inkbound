import { View } from 'react-native';

import { content, type Race } from '@/content';
import { raceMeta } from '@/content/meta/races';
import { ArtCard } from '@/ui/ArtCard';
import { BackSection, BackText, CardBack } from '@/ui/cards/CardBack';
import { Chip } from '@/ui/Chip';
import { FlipCard } from '@/ui/FlipCard';

/** Front chips: ability bonuses, speed, and darkvision when the race has it. */
export function raceChips(race: Race): string[] {
  const chips = race.abilityBonuses.map((b) => `+${b.bonus} ${b.abilityScore.toUpperCase()}`);
  if (race.abilityBonusOptions) chips.push(`+1 ×${race.abilityBonusOptions.choose} any`);
  chips.push(`${race.speed} ft`);
  if (race.traits.includes('darkvision')) chips.push('Darkvision');
  return chips;
}

export function RaceCard({ race, width, selected }: { race: Race; width: number; selected?: boolean }) {
  const meta = raceMeta[race.index];
  const height = (width * 4) / 3;
  return (
    <FlipCard
      width={width}
      height={height}
      accessibilityLabel={`${race.name}. ${meta.tagline}`}
      front={
        <ArtCard
          kind="races"
          id={race.index}
          name={race.name}
          tagline={meta.tagline}
          chips={raceChips(race)}
          color={meta.spot.color}
          width={width}
          selected={selected}
        />
      }
      back={
        <CardBack title={race.name} subtitle={`${race.size} · ${race.speed} ft`} color={meta.spot.color}>
          <BackSection label="Ability bonuses">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {raceChips(race)
                .filter((c) => c.startsWith('+'))
                .map((c) => (
                  <Chip key={c} label={c} tone="onPage" />
                ))}
            </View>
          </BackSection>
          <BackSection label="Traits">
            {race.traits.map((id) => {
              const trait = content.traits.find(id);
              return trait ? (
                <BackText key={id}>
                  <BackText>{`${trait.name}. `}</BackText>
                  {trait.desc[0]}
                </BackText>
              ) : null;
            })}
          </BackSection>
          {race.subraces.length ? (
            <BackSection label="Lineages">
              <BackText>{race.subraces.map((s) => content.subraces.get(s).name).join(', ')}</BackText>
            </BackSection>
          ) : null}
          <BackSection label="Languages">
            <BackText>{race.languageDesc}</BackText>
          </BackSection>
        </CardBack>
      }
    />
  );
}
