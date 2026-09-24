import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { content } from '@/content';
import { describe } from '@/content/describe';
import { Section, TabBody } from '@/sheet/parts';
import { ResourceList } from '@/sheet/ResourceList';
import { useSheet } from '@/sheet/useSheet';
import { fonts, palettes, space } from '@/ui/theme';

/** SRD feature ids that just announce a choice or a level-up bump; hidden to keep the list readable. */
const HIDDEN = /^(ability-score-improvement|.*-subclass|.*-ability-score-improvement.*)$/;

export default function Features() {
  const { character, sheet } = useSheet()!;
  const [open, setOpen] = useState<string>();
  const cls = content.classes.get(character.classes[0].classId);
  const background = content.backgrounds.find(character.background);
  // Picks made for features (fighting style, expertise...) are shown with their feature.
  const picks = (featureId: string) =>
    Object.entries(character.choices)
      .filter(([k]) => k.startsWith(`feature:${featureId}:`))
      .flatMap(([, v]) => v.map((id) => describe(id).name));

  const features = sheet.features
    .map((id) => content.features.find(id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f) && !HIDDEN.test(f!.index))
    .sort((a, b) => a.level - b.level);
  const traits = sheet.traits.map((id) => content.traits.find(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const item = (key: string, name: string, meta: string, desc: string[], chosen: string[] = []) => {
    const expanded = open === key;
    return (
      <Pressable
        key={key}
        onPress={() => setOpen(expanded ? undefined : key)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={styles.feature}>
        <View style={styles.featureHead}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        {chosen.length ? <Text style={styles.chosen}>{chosen.join(', ')}</Text> : null}
        <Text style={styles.desc} numberOfLines={expanded ? undefined : 2}>
          {desc.join('\n\n')}
        </Text>
      </Pressable>
    );
  };

  return (
    <TabBody>
      <ResourceList />
      <Section title={`${cls.name} features`}>
        {features.map((f) => item(f.index, f.name, `Level ${f.level}${f.subclass ? ` · ${content.subclasses.get(f.subclass).name}` : ''}`, f.desc, picks(f.index)))}
      </Section>
      <Section title="Racial traits">{traits.map((t) => item(t.index, t.name, 'Race', t.desc))}</Section>
      {background ? <Section title="Background">{item('background', background.feature.name, background.name, background.feature.desc)}</Section> : null}
      <Section title="Proficiencies">
        <Text style={styles.desc}>
          {[...sheet.proficiencies]
            .filter((p) => !p.startsWith('skill-') && !p.startsWith('saving-throw-'))
            .map((p) => content.proficiencies.find(p)?.name ?? describe(p).name)
            .join(', ')}
        </Text>
      </Section>
    </TabBody>
  );
}

const styles = StyleSheet.create({
  feature: { paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule, gap: 4 },
  featureHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.md },
  name: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: palettes.dark.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: palettes.dark.inkMuted },
  chosen: { fontFamily: fonts.bodyBold, fontSize: 13, color: palettes.dark.accent },
  desc: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: palettes.dark.inkMuted },
});
