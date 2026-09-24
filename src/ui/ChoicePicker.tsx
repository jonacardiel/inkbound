import { Pressable, StyleSheet, Text, View } from 'react-native';

import { content } from '@/content';
import type { ArtKind } from '@/content/art/manifest';
import { describe } from '@/content/describe';
import { schoolMeta } from '@/content/meta/races';
import type { Choice, ChoiceOption } from '@/rules/choices';
import { ArtImage } from '@/ui/ArtImage';
import { fonts, palettes, space } from '@/ui/theme';

type Props = {
  choice: Choice;
  /** All current picks, keyed by choice id (bundles need their sub-picks too). */
  choices: Record<string, string[]>;
  onChange: (choiceId: string, values: string[]) => void;
  color: string;
  /** Options the character already has from elsewhere (shown locked, e.g. a skill from race). */
  locked?: Set<string>;
};

/**
 * Renders any Choice. The choice's `view` picks the visual form; equipment
 * bundles ("(a) chain mail or (b) leather armor, longbow...") get A-vs-B cards
 * that reveal their own sub-picks.
 */
export function ChoicePicker({ choice, choices, onChange, color, locked }: Props) {
  const selected = choices[choice.id] ?? [];
  const remaining = choice.count - selected.length;
  const isBundle = choice.options.some((o) => o.items || o.subChoices);

  const toggle = (id: string) => {
    if (locked?.has(id)) return;
    if (selected.includes(id)) onChange(choice.id, selected.filter((s) => s !== id));
    else if (choice.count === 1) onChange(choice.id, [id]);
    else if (remaining > 0) onChange(choice.id, [...selected, id]);
  };

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text style={styles.label}>{choice.label}</Text>
        <Text style={[styles.counter, { color: remaining > 0 ? color : palettes.dark.inkMuted }]}>
          {remaining > 0 ? `Pick ${remaining}${choice.count > 1 && selected.length ? ' more' : ''}` : '✓'}
        </Text>
      </View>
      {isBundle ? (
        <View style={{ gap: space.md }}>
          {choice.options.map((option, i) => (
            <Bundle
              key={option.id}
              letter={String.fromCharCode(97 + i)}
              option={option}
              selected={selected.includes(option.id)}
              onPress={() => toggle(option.id)}
              choices={choices}
              onChange={onChange}
              color={color}
            />
          ))}
        </View>
      ) : (
        <View style={choice.view === 'chip' ? styles.chipRow : choice.view === 'spellCard' ? styles.list : styles.grid}>
          {choice.options.map((option) => (
            <OptionView
              key={option.id}
              view={choice.view}
              id={option.id}
              selected={selected.includes(option.id)}
              locked={locked?.has(option.id) ?? false}
              disabled={remaining <= 0 && choice.count > 1 && !selected.includes(option.id)}
              onPress={() => toggle(option.id)}
              color={color}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function artKindOf(id: string): ArtKind | undefined {
  if (content.subclasses.find(id)) return 'subclasses';
  if (content.traits.find(id)?.parent === 'draconic-ancestry') return 'ancestries';
  if (content.equipment.find(id)) return 'items';
  return undefined;
}

function OptionView({
  view,
  id,
  selected,
  locked,
  disabled,
  onPress,
  color,
}: {
  view: Choice['view'];
  id: string;
  selected: boolean;
  locked: boolean;
  disabled: boolean;
  onPress: () => void;
  color: string;
}) {
  const { name, blurb } = describe(id);
  const active = selected || locked;
  const a11y = {
    accessibilityRole: 'checkbox' as const,
    accessibilityState: { checked: active, disabled: disabled || locked },
    accessibilityLabel: locked ? `${name}, already granted` : name,
  };
  const border = { borderColor: active ? color : palettes.dark.rule, borderWidth: active ? 2 : 1 };

  if (view === 'chip') {
    return (
      <Pressable {...a11y} onPress={onPress} disabled={disabled} style={[styles.chip, border, active && { backgroundColor: color }]}>
        <Text style={[styles.chipText, { color: active ? palettes.dark.table : palettes.dark.ink }]}>{name}</Text>
      </Pressable>
    );
  }

  if (view === 'spellCard') {
    const spell = content.spells.find(id);
    const school = spell ? schoolMeta[spell.school] : undefined;
    return (
      <Pressable {...a11y} onPress={onPress} disabled={disabled} style={[styles.spell, border, { opacity: disabled ? 0.45 : 1 }]}>
        <View style={[styles.spellStripe, { backgroundColor: school?.color ?? color }]} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.optionName}>{name}</Text>
          {spell ? (
            <Text style={styles.meta}>
              {[spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`, content.magicSchools.get(spell.school).name, spell.castingTime, spell.concentration ? 'Concentration' : null, spell.ritual ? 'Ritual' : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          ) : null}
          {blurb ? (
            <Text style={styles.blurb} numberOfLines={2}>
              {blurb}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  const kind = view === 'artCard' || view === 'itemCard' ? artKindOf(id) : undefined;
  return (
    <Pressable {...a11y} onPress={onPress} disabled={disabled || locked} style={[styles.tile, border, { opacity: disabled ? 0.45 : 1 }]}>
      {kind ? <ArtImage kind={kind} id={id} name={name} color={color} aspect="1:1" style={styles.tileArt} /> : null}
      <Text style={styles.optionName} numberOfLines={2}>
        {name}
      </Text>
      {locked ? <Text style={[styles.meta, { color }]}>Already granted</Text> : null}
      {blurb && view !== 'itemCard' ? (
        <Text style={styles.blurb} numberOfLines={view === 'artCard' ? 4 : 2}>
          {blurb}
        </Text>
      ) : null}
      {view === 'itemCard' ? <Text style={styles.meta}>{itemStats(id)}</Text> : null}
    </Pressable>
  );
}

/** One-line stats for an item card: damage for weapons, AC for armor, weight otherwise. */
export function itemStats(id: string): string {
  const e = content.equipment.find(id);
  if (!e) return '';
  if (e.damage) return `${e.damage.damageDice} ${e.damage.damageType}${e.properties?.includes('finesse') ? ' · finesse' : ''}`;
  if (e.armorClass) return e.armorCategory === 'Shield' ? '+2 AC' : `AC ${e.armorClass.base}${e.armorClass.dexBonus ? (e.armorClass.maxBonus ? ' + DEX (max 2)' : ' + DEX') : ''}`;
  return e.weight ? `${e.weight} lb` : '';
}

function Bundle({
  letter,
  option,
  selected,
  onPress,
  choices,
  onChange,
  color,
}: {
  letter: string;
  option: ChoiceOption;
  selected: boolean;
  onPress: () => void;
  choices: Record<string, string[]>;
  onChange: (id: string, values: string[]) => void;
  color: string;
}) {
  const items = option.items ?? [];
  const summary = [
    ...items.map((i) => `${i.count > 1 ? `${i.count} ` : ''}${describe(i.id).name}`),
    ...(option.subChoices ?? []).map((s) => s.label),
  ].join(' + ');

  return (
    <View style={[styles.bundle, { borderColor: selected ? color : palettes.dark.rule, borderWidth: selected ? 2 : 1 }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`Option ${letter}: ${summary}`}
        style={styles.bundleHead}>
        <View style={[styles.letter, { borderColor: color, backgroundColor: selected ? color : 'transparent' }]}>
          <Text style={[styles.letterText, { color: selected ? palettes.dark.table : color }]}>{letter}</Text>
        </View>
        <Text style={[styles.optionName, { flex: 1 }]}>{summary}</Text>
      </Pressable>
      {items.length ? (
        <View style={styles.bundleItems}>
          {items.map((i) => (
            <View key={i.id} style={styles.bundleItem}>
              <ArtImage kind="items" id={i.id} name={describe(i.id).name} color={color} aspect="1:1" style={styles.bundleArt} />
              <Text style={styles.meta} numberOfLines={2}>
                {itemStats(i.id) || describe(i.id).name}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {selected
        ? option.subChoices?.map((sub) => (
            <ChoicePicker key={sub.id} choice={sub} choices={choices} onChange={onChange} color={color} />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.md },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md },
  label: { flex: 1, fontFamily: fonts.display, fontSize: 19, color: palettes.dark.ink },
  counter: { fontFamily: fonts.bodyBold, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  list: { gap: space.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  tile: { width: '48.5%', borderRadius: 6, padding: space.md, gap: 4, backgroundColor: '#1F1914' },
  tileArt: { width: '100%', borderRadius: 3, marginBottom: 4 },
  optionName: { fontFamily: fonts.bodyBold, fontSize: 15, color: palettes.dark.ink },
  blurb: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: palettes.dark.inkMuted },
  meta: { fontFamily: fonts.body, fontSize: 12, color: palettes.dark.inkMuted },
  spell: { flexDirection: 'row', gap: space.md, borderRadius: 6, padding: space.md, backgroundColor: '#1F1914' },
  spellStripe: { width: 4, borderRadius: 2 },
  bundle: { borderRadius: 8, padding: space.md, gap: space.md, backgroundColor: '#1B1612' },
  bundleHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  letter: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: fonts.display, fontSize: 16 },
  bundleItems: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  bundleItem: { width: 84, gap: 4 },
  bundleArt: { width: 84, borderRadius: 4 },
});
