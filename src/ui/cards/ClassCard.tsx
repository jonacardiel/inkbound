import { StyleSheet, Text, View } from 'react-native';

import { content, type CharClass } from '@/content';
import { classMeta, type Role } from '@/content/meta/classes';
import { ArtCard } from '@/ui/ArtCard';
import { BackSection, BackText, CardBack } from '@/ui/cards/CardBack';
import { FlipCard } from '@/ui/FlipCard';
import { classColors, fonts, palettes } from '@/ui/theme';

const ROLE_LABEL: Record<Role, string> = {
  offense: 'Offense',
  defense: 'Defense',
  support: 'Support',
  magic: 'Magic',
  mobility: 'Mobility',
  complexity: 'Complexity',
};

export function classChips(cls: CharClass): string[] {
  const meta = classMeta[cls.index];
  const chips = [`d${cls.hitDie} HP`, meta.primary.map((a) => a.toUpperCase()).join(' / ')];
  if (meta.newPlayerFriendly) chips.push('New-player friendly');
  return chips;
}

/** Role ratings as horizontal bars (a radar chart would be harder to read at this size). */
function RoleBars({ roles, color }: { roles: Record<Role, number>; color: string }) {
  return (
    <View style={{ gap: 5 }}>
      {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
        <View key={role} style={styles.roleRow} accessible accessibilityLabel={`${ROLE_LABEL[role]} ${roles[role]} of 5`}>
          <Text style={styles.roleLabel}>{ROLE_LABEL[role]}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(roles[role] / 5) * 100}%`, backgroundColor: color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ClassCard({ cls, width, selected }: { cls: CharClass; width: number; selected?: boolean }) {
  const meta = classMeta[cls.index];
  const color = classColors[cls.index];
  const height = (width * 4) / 3;
  const armor = cls.proficiencies.filter((p) => p.includes('armor') || p === 'shields').map((p) => content.proficiencies.find(p)?.name ?? p);
  const weapons = cls.proficiencies.filter((p) => p.endsWith('weapons')).map((p) => content.proficiencies.find(p)?.name ?? p);

  return (
    <FlipCard
      width={width}
      height={height}
      accessibilityLabel={`${cls.name}. ${meta.tagline}`}
      front={
        <ArtCard kind="classes" id={cls.index} name={cls.name} tagline={meta.tagline} chips={classChips(cls)} color={color} width={width} selected={selected} />
      }
      back={
        <CardBack title={cls.name} subtitle={`Hit die d${cls.hitDie} · Saves ${cls.savingThrows.map((s) => s.toUpperCase()).join(', ')}`} color={color}>
          <BackSection label="Role">
            <RoleBars roles={meta.roles} color={color} />
          </BackSection>
          <BackSection label="Armor">
            <BackText>{armor.length ? armor.join(', ') : 'None'}</BackText>
          </BackSection>
          <BackSection label="Weapons">
            <BackText>{weapons.length ? weapons.join(', ') : 'A few simple weapons'}</BackText>
          </BackSection>
          {cls.spellcasting ? (
            <BackSection label="Spellcasting">
              <BackText>{`Casts with ${cls.spellcasting.spellcastingAbility.toUpperCase()} from level ${cls.spellcasting.level}.`}</BackText>
            </BackSection>
          ) : null}
        </CardBack>
      }
    />
  );
}

const styles = StyleSheet.create({
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleLabel: { width: 84, fontFamily: fonts.body, fontSize: 13, color: palettes.dark.pageInk },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#D6C9AE', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
