import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { d20Plus } from '@/rules/dice';
import { toggleRage } from '@/rules/play';
import { Button, Section, TabBody } from '@/sheet/parts';
import { useRolls } from '@/sheet/rolls';
import { useSheet } from '@/sheet/useSheet';
import { signedNumber } from '@/ui/AbilityMedallion';
import { ResourceList } from '@/sheet/ResourceList';
import { fonts, palettes, space } from '@/ui/theme';

export default function Combat() {
  const { character, sheet, color, update } = useSheet()!;
  const roll = useRolls((r) => r.roll);
  // Remember whether the last attack roll per weapon was a natural 20, so damage doubles its dice.
  const [crits, setCrits] = useState<Record<string, boolean>>({});
  const rage = sheet.resources.find((r) => r.id === 'rage');

  return (
    <TabBody>
      <Section
        title="Attacks"
        right={sheet.attacksPerAction > 1 ? <Text style={styles.small}>{`${sheet.attacksPerAction} attacks per Attack action`}</Text> : undefined}>
        {sheet.attacks.map((atk) => {
          const crit = crits[atk.name];
          return (
            <View key={atk.name} style={styles.attack}>
              <View style={{ flex: 1 }}>
                <Text style={styles.attackName}>{atk.name}</Text>
                <Text style={styles.small}>{`${atk.range} · ${atk.damageType}`}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${atk.name} attack roll ${signedNumber(atk.toHit)}`}
                onPress={() => {
                  const r = roll(d20Plus(atk.toHit), `${atk.name} attack`);
                  setCrits((c) => ({ ...c, [atk.name]: r.crit === 'success' }));
                }}
                style={({ pressed }) => [styles.pill, { borderColor: color }, pressed && { opacity: 0.7 }]}>
                <Text style={styles.pillValue}>{signedNumber(atk.toHit)}</Text>
                <Text style={styles.pillLabel}>TO HIT</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${atk.name} damage ${atk.damage}${crit ? ', critical hit' : ''}`}
                onPress={() => {
                  // Flat damage like "2" (unarmed strike) isn't a dice expression with dice; roll it as-is.
                  roll(atk.damage, `${atk.name} damage${crit ? ' (critical)' : ''}`, { critical: crit });
                  setCrits((c) => ({ ...c, [atk.name]: false }));
                }}
                style={({ pressed }) => [styles.pill, { borderColor: crit ? color : palettes.dark.rule }, crit && { backgroundColor: color }, pressed && { opacity: 0.7 }]}>
                <Text style={[styles.pillValue, crit && { color: palettes.dark.table }]}>{atk.damage}</Text>
                <Text style={[styles.pillLabel, crit && { color: palettes.dark.table }]}>{crit ? 'CRIT DMG' : 'DAMAGE'}</Text>
              </Pressable>
            </View>
          );
        })}
        {sheet.sneakAttack ? (
          <Button label={`Sneak Attack ${sheet.sneakAttack}`} color={color} onPress={() => roll(sheet.sneakAttack!, 'Sneak Attack')} />
        ) : null}
      </Section>

      {rage ? (
        <Section title="Rage">
          <Button
            label={character.play.raging ? 'End rage' : `Rage (${rage.max - (character.play.resourcesSpent.rage ?? 0)} left)`}
            color={color}
            kind={character.play.raging ? 'solid' : 'outline'}
            disabled={!character.play.raging && (character.play.resourcesSpent.rage ?? 0) >= rage.max}
            onPress={() => update(toggleRage)}
          />
          <Text style={styles.small}>
            {character.play.raging
              ? 'Raging: bonus melee damage is included above; resistance to bludgeoning, piercing and slashing damage; advantage on Strength checks and saves.'
              : 'Starting a rage spends a use and adds your rage damage to Strength melee attacks.'}
          </Text>
        </Section>
      ) : null}

      <ResourceList filter={(r) => r.id !== 'rage'} />
    </TabBody>
  );
}

const styles = StyleSheet.create({
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: palettes.dark.inkMuted },
  attack: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule },
  attackName: { fontFamily: fonts.bodyBold, fontSize: 16, color: palettes.dark.ink },
  pill: { minWidth: 70, minHeight: 50, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  pillValue: { fontFamily: fonts.display, fontSize: 18, color: palettes.dark.ink },
  pillLabel: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1, color: palettes.dark.inkMuted },
});
