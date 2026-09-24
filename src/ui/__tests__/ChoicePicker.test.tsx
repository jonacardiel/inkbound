import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from 'react-native';

import { emptyBio, emptyPlayState, type Character } from '@/rules/character';
import { allChoices, type Choice } from '@/rules/choices';

import { ChoicePicker } from '../ChoicePicker';

const cleric: Character = {
  id: 'c',
  schemaVersion: 1,
  name: 'C',
  race: 'human',
  background: 'acolyte',
  classes: [{ classId: 'cleric', subclassId: 'life', level: 1 }],
  abilityMethod: 'standard',
  baseScores: { str: 13, dex: 12, con: 14, int: 8, wis: 15, cha: 10 },
  choices: {},
  hpRolls: [],
  inventory: [],
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  play: emptyPlayState(),
  bio: emptyBio(),
};
const choice = (id: string): Choice => allChoices(cleric, { includeEquipment: true }).find((c) => c.id === id)!;

function Harness(props: { choice: Choice; locked?: Set<string>; isProficient?: (id: string) => boolean }) {
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  return (
    <>
      <ChoicePicker {...props} color="#E3B43C" choices={choices} onChange={(id, v) => setChoices((c) => ({ ...c, [id]: v }))} />
      {Object.entries(choices).map(([k, v]) => (
        <ChoiceState key={k} id={k} values={v} />
      ))}
    </>
  );
}
const ChoiceState = ({ id, values }: { id: string; values: string[] }) => <Text>{`${id}=${values.join(',')}`}</Text>;

test('skills: picks up to the limit, then other options are disabled', async () => {
  await render(<Harness choice={choice('class:cleric:proficiencyChoices:0')} locked={new Set(['skill-insight', 'skill-religion'])} />);
  expect(screen.getByText('Pick 2')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Medicine'));
  expect(screen.getByText('Pick 1 more')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('History'));
  expect(screen.getByText('✓')).toBeTruthy();
  // A third pick is refused.
  await fireEvent.press(screen.getByLabelText('Persuasion'));
  expect(screen.getByText('class:cleric:proficiencyChoices:0=skill-medicine,skill-history')).toBeTruthy();
  // Tapping a pick again removes it.
  await fireEvent.press(screen.getByLabelText('Medicine'));
  expect(screen.getByText('class:cleric:proficiencyChoices:0=skill-history')).toBeTruthy();
});

test('locked options are shown as granted and cannot be toggled', async () => {
  await render(<Harness choice={choice('class:cleric:proficiencyChoices:0')} locked={new Set(['skill-insight'])} />);
  await fireEvent.press(screen.getByLabelText('Insight, already granted'));
  expect(screen.queryByText(/skill-insight/)).toBeNull();
});

test('gear bundles: "warhammer (if proficient)" is disabled without the proficiency', async () => {
  await render(<Harness choice={choice('class:cleric:startingEquipmentOptions:0')} isProficient={(id) => id !== 'warhammers'} />);
  expect(screen.getByLabelText(/Option b: Warhammer, requires a proficiency/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText(/Option b: Warhammer/));
  expect(screen.queryByText(/startingEquipmentOptions:0=1/)).toBeNull();
  await fireEvent.press(screen.getByLabelText('Option a: Mace'));
  expect(screen.getByText('class:cleric:startingEquipmentOptions:0=0')).toBeTruthy();
});
