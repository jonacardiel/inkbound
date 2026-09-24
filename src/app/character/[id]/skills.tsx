import { Text } from 'react-native';

import { content } from '@/content';
import { d20Plus } from '@/rules/dice';
import { Row, Section, TabBody } from '@/sheet/parts';
import { useRolls } from '@/sheet/rolls';
import { useSheet } from '@/sheet/useSheet';
import { signedNumber } from '@/ui/AbilityMedallion';
import { fonts, palettes } from '@/ui/theme';

export default function Skills() {
  const { sheet } = useSheet()!;
  const roll = useRolls((r) => r.roll);

  return (
    <TabBody>
      <Section title="Skills" right={<Text style={{ fontFamily: fonts.body, fontSize: 13, color: palettes.dark.inkMuted }}>● proficient · ◆ expertise</Text>}>
        {content.skills.all.map((skill) => {
          const line = sheet.skills[`skill-${skill.index}`];
          const marker = line.expertise ? '◆' : line.proficient ? '●' : '';
          return (
            <Row
              key={skill.index}
              title={skill.name}
              detail={skill.abilityScore.toUpperCase()}
              value={signedNumber(line.bonus)}
              marker={marker || ' '}
              a11y={`${skill.name} ${signedNumber(line.bonus)}${line.expertise ? ', expertise' : line.proficient ? ', proficient' : ''}. Tap to roll.`}
              onPress={() => roll(d20Plus(line.bonus), skill.name)}
            />
          );
        })}
      </Section>
    </TabBody>
  );
}
