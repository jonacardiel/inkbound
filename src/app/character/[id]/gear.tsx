import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { content, findItem } from '@/content';
import type { Character, Currency } from '@/rules/character';
import { addItem, MAX_ATTUNED, setCurrency, updateItem } from '@/rules/play';
import { Button, Section, TabBody } from '@/sheet/parts';
import { useSheet } from '@/sheet/useSheet';
import { ArtImage } from '@/ui/ArtImage';
import { itemStats } from '@/ui/ChoicePicker';
import { fonts, palettes, rarityColors, space } from '@/ui/theme';

const COINS: (keyof Currency)[] = ['pp', 'gp', 'ep', 'sp', 'cp'];

type Entry = Character['inventory'][number];

/** "Armor, +1" / "Weapon, +2": generic magic items that need a base armor or weapon. */
const GENERIC_MAGIC = /^(armor|weapon)-(\d)$/;

function itemInfo(entry: Entry) {
  const item = entry.itemId ? findItem(entry.itemId) : undefined;
  const magic = item && 'rarity' in item ? item : undefined;
  const generic = entry.itemId?.match(GENERIC_MAGIC);
  const base = generic && entry.baseItemId ? content.equipment.find(entry.baseItemId) : undefined;
  const mundane = base ?? (item && !magic ? content.equipment.find(item.index) : undefined);
  const name = entry.custom?.name ?? (base ? `${base.name} +${generic![2]}` : item?.name ?? 'Item');
  const weight = (entry.custom?.weight ?? mundane?.weight ?? 0) * entry.qty;
  const rarity = magic?.rarity.name.toLowerCase();
  const attunement = Boolean(magic?.desc[0]?.includes('requires attunement'));
  const equippable = Boolean(mundane?.armorCategory || mundane?.weaponCategory);
  // Magic items use category art (potion, ring...) until each has its own.
  const artId = mundane?.index ?? (magic ? `magic-${magicCategory(magic.equipmentCategory, magic.name)}` : undefined);
  return { item, magic, mundane, name, weight, rarity, attunement, equippable, artId };
}

function magicCategory(category: string, name: string): string {
  if (/potion/i.test(name) || category === 'potion') return 'potion';
  if (category === 'ring') return 'ring';
  if (category === 'wand') return 'wand';
  if (category === 'rod') return 'rod';
  if (category === 'staff') return 'staff';
  if (category === 'scroll') return 'scroll';
  if (category === 'armor') return 'armor';
  if (category === 'weapon' || category === 'ammunition') return 'weapon';
  return 'wondrous';
}

export default function Gear() {
  const { character, sheet, color, update } = useSheet()!;
  const [selected, setSelected] = useState<number>();
  const [adding, setAdding] = useState(false);
  const carried = character.inventory.reduce((n, e) => n + itemInfo(e).weight, 0);
  const attuned = character.inventory.filter((i) => i.attuned).length;

  return (
    <TabBody>
      <Section title="Coins">
        <View style={styles.coins}>
          {COINS.map((coin) => (
            <View key={coin} style={styles.coin}>
              <TextInput
                value={String(character.currency[coin])}
                onChangeText={(v) => update((c) => setCurrency(c, coin, Number(v.replace(/\D/g, '')) || 0))}
                keyboardType="number-pad"
                accessibilityLabel={`${coin.toUpperCase()} coins`}
                style={styles.coinInput}
                selectTextOnFocus
              />
              <Text style={styles.coinLabel}>{coin.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section
        title="Inventory"
        right={<Text style={[styles.small, carried > sheet.carryingCapacity && { color: '#E0605A' }]}>{`${Math.round(carried)} / ${sheet.carryingCapacity} lb · attuned ${attuned}/${MAX_ATTUNED}`}</Text>}>
        <View style={styles.grid}>
          {character.inventory.map((entry, index) => {
            const info = itemInfo(entry);
            const frame = info.rarity ? rarityColors[info.rarity] ?? color : entry.equipped ? color : palettes.dark.rule;
            return (
              <Pressable
                key={`${entry.itemId ?? entry.custom?.name}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${info.name}${entry.qty > 1 ? `, ${entry.qty}` : ''}${entry.equipped ? ', equipped' : ''}${entry.attuned ? ', attuned' : ''}`}
                onPress={() => setSelected(index)}
                style={[styles.tile, { borderColor: frame, borderWidth: info.rarity || entry.equipped ? 2 : 1 }]}>
                {info.artId ? (
                  <ArtImage kind="items" id={info.artId} name={info.name} color={frame} aspect="1:1" style={styles.tileArt} />
                ) : (
                  <View style={[styles.tileArt, styles.customArt]}>
                    <Text style={styles.customInitial}>{info.name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.tileName} numberOfLines={2}>
                  {info.name}
                </Text>
                <View style={styles.badges}>
                  {entry.qty > 1 ? <Text style={styles.badge}>{`×${entry.qty}`}</Text> : null}
                  {entry.equipped ? <Text style={[styles.badge, { color }]}>E</Text> : null}
                  {entry.attuned ? <Text style={[styles.badge, { color }]}>A</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Button label="Add item" color={color} onPress={() => setAdding(true)} />
      </Section>

      <ItemModal index={selected} onClose={() => setSelected(undefined)} />
      <AddItemModal visible={adding} onClose={() => setAdding(false)} onAdd={(entry) => update((c) => addItem(c, entry))} />
    </TabBody>
  );
}

function ItemModal({ index, onClose }: { index?: number; onClose: () => void }) {
  const { character, color, update } = useSheet()!;
  const [error, setError] = useState<string>();
  const entry = index !== undefined ? character.inventory[index] : undefined;
  if (!entry || index === undefined) return null;
  const info = itemInfo(entry);
  const change = (c: Partial<Entry>) => {
    try {
      update((ch) => updateItem(ch, index, c));
      setError(undefined);
      if (c.qty === 0) onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const desc = info.magic?.desc ?? info.mundane?.desc ?? (entry.custom?.desc ? [entry.custom.desc] : []);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalWrap} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => undefined}>
          <Text style={styles.modalTitle}>{info.name}</Text>
          <Text style={styles.small}>{[info.rarity ? info.rarity : null, info.mundane ? itemStats(info.mundane.index) : null].filter(Boolean).join(' · ')}</Text>
          {desc.slice(0, 4).map((d) => (
            <Text key={d} style={styles.desc}>
              {d}
            </Text>
          ))}
          <View style={styles.qtyRow}>
            <Button label="−" color={palettes.dark.rule} a11y="Remove one" onPress={() => change({ qty: entry.qty - 1 })} />
            <Text style={styles.qty}>{entry.qty}</Text>
            <Button label="+" color={palettes.dark.rule} a11y="Add one" onPress={() => change({ qty: entry.qty + 1 })} />
          </View>
          {info.equippable ? <Button label={entry.equipped ? 'Unequip' : 'Equip'} color={color} kind={entry.equipped ? 'solid' : 'outline'} onPress={() => change({ equipped: !entry.equipped })} /> : null}
          {info.attunement ? <Button label={entry.attuned ? 'End attunement' : 'Attune'} color={color} kind={entry.attuned ? 'solid' : 'outline'} onPress={() => change({ attuned: !entry.attuned })} /> : null}
          {error ? <Text style={[styles.small, { color: '#E0605A' }]}>{error}</Text> : null}
          <Button label="Close" color={palettes.dark.inkMuted} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AddItemModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (entry: Entry) => void }) {
  const { color } = useSheet()!;
  const [query, setQuery] = useState('');
  const [generic, setGeneric] = useState<string>();
  const all = useMemo(
    () => [
      ...content.equipment.all.map((e) => ({ id: e.index, name: e.name, kind: 'gear' })),
      // Generic +N armor/weapons are listed as their +1/+2/+3 variants; other variants stay grouped.
      ...content.magicItems.all
        .filter((m) => (GENERIC_MAGIC.test(m.index) ? true : !m.variant && m.index !== 'armor' && m.index !== 'weapon'))
        .map((m) => ({ id: m.index, name: m.name, kind: m.rarity.name })),
    ],
    [],
  );
  const q = query.trim().toLowerCase();
  const results = q ? all.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 40) : [];
  const close = () => {
    setQuery('');
    setGeneric(undefined);
    onClose();
  };
  const bases = generic
    ? content.equipment.all.filter((e) => (generic.startsWith('armor') ? e.armorCategory && e.armorCategory !== 'Shield' : e.weaponCategory))
    : [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.modalWrap}>
        <View style={[styles.modal, { maxHeight: '85%' }]}>
          <Text style={styles.modalTitle}>{generic ? `Which ${generic.startsWith('armor') ? 'armor' : 'weapon'} is it?` : 'Add item'}</Text>
          {generic ? (
            <FlatList
              data={bases}
              keyExtractor={(i) => i.index}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable accessibilityRole="button" onPress={() => { onAdd({ itemId: generic, baseItemId: item.index, qty: 1 }); close(); }} style={styles.result}>
                  <Text style={styles.resultName}>{`${item.name} +${generic.slice(-1)}`}</Text>
                  <Text style={styles.small}>{itemStats(item.index)}</Text>
                </Pressable>
              )}
            />
          ) : null}
          {generic ? null : (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search gear and magic items"
            placeholderTextColor={palettes.dark.inkMuted}
            autoFocus
            accessibilityLabel="Search items"
            style={styles.search}
          />
          )}
          {generic ? null : (
          <FlatList
            data={results}
            keyExtractor={(i) => i.id}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (GENERIC_MAGIC.test(item.id)) return setGeneric(item.id);
                  onAdd({ itemId: item.id, qty: 1 });
                  close();
                }}
                style={styles.result}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={[styles.small, item.kind !== 'gear' && { color: rarityColors[item.kind.toLowerCase()] ?? color }]}>{item.kind}</Text>
              </Pressable>
            )}
          />
          )}
          {q && !generic ? <Button label={`Add "${query.trim()}" as a custom item`} color={color} onPress={() => { onAdd({ custom: { name: query.trim() }, qty: 1 }); close(); }} /> : null}
          <Button label="Cancel" color={palettes.dark.inkMuted} onPress={close} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: palettes.dark.inkMuted },
  desc: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: palettes.dark.ink },
  coins: { flexDirection: 'row', gap: space.sm },
  coin: { flex: 1, alignItems: 'center', gap: 2 },
  coinInput: { width: '100%', minHeight: 44, borderWidth: 1, borderColor: palettes.dark.rule, borderRadius: 6, textAlign: 'center', color: palettes.dark.ink, fontFamily: fonts.display, fontSize: 18 },
  coinLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: palettes.dark.inkMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { width: '31.5%', borderRadius: 6, padding: 6, gap: 4, backgroundColor: '#1F1914' },
  tileArt: { width: '100%', aspectRatio: 1, borderRadius: 4 },
  customArt: { backgroundColor: palettes.dark.page, alignItems: 'center', justifyContent: 'center' },
  customInitial: { fontFamily: fonts.display, fontSize: 32, color: palettes.dark.pageInk },
  tileName: { fontFamily: fonts.bodyBold, fontSize: 12, color: palettes.dark.ink },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { fontFamily: fonts.bodyBold, fontSize: 11, color: palettes.dark.inkMuted },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  modal: { width: '100%', maxWidth: 440, backgroundColor: '#1B1612', borderRadius: 12, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: palettes.dark.rule },
  modalTitle: { fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  qty: { flex: 1, textAlign: 'center', fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink },
  search: { minHeight: 46, borderWidth: 1, borderColor: palettes.dark.rule, borderRadius: 6, paddingHorizontal: space.md, color: palettes.dark.ink, fontFamily: fonts.body, fontSize: 16 },
  result: { paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palettes.dark.rule, minHeight: 44 },
  resultName: { fontFamily: fonts.bodyBold, fontSize: 15, color: palettes.dark.ink },
});
