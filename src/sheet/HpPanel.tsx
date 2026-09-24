import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { content } from '@/content';
import { applyDamage, currentHp, heal, setTempHp } from '@/rules/play';
import { useSheet } from '@/sheet/useSheet';
import { fonts, palettes, space } from '@/ui/theme';

const HURT = '#C23B3B';
const HEALED = '#6DAA45';

/** HP readout with a bar; tapping opens a number pad for damage, healing and temp HP. */
export function HpPanel() {
  const s = useSheet()!;
  const [open, setOpen] = useState(false);
  const hp = currentHp(s.character, s.sheet);
  const max = s.sheet.maxHp;
  const temp = s.character.play.tempHp;
  const ratio = hp / max;
  const barColor = ratio > 0.5 ? HEALED : ratio > 0.25 ? '#E3B43C' : HURT;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Hit points ${hp} of ${max}${temp ? `, plus ${temp} temporary` : ''}. Tap to change.`}
        onPress={() => setOpen(true)}
        style={styles.panel}>
        <View style={styles.numbers}>
          <Text style={styles.hp}>{hp}</Text>
          <Text style={styles.max}>{`/ ${max}`}</Text>
          {temp ? <Text style={[styles.temp, { color: s.color }]}>{`+${temp} temp`}</Text> : null}
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(0, ratio) * 100}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={styles.caption}>HIT POINTS</Text>
      </Pressable>
      <HpPad visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function HpPad({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const s = useSheet()!;
  const insets = useSafeAreaInsets();
  const [entry, setEntry] = useState('');
  const [notice, setNotice] = useState<string>();
  const amount = Number(entry || 0);

  const press = (key: string) => setEntry((e) => (key === '⌫' ? e.slice(0, -1) : (e + key).replace(/^0+/, '').slice(0, 3)));
  const done = (message?: string) => {
    setEntry('');
    setNotice(message);
    if (!message) onClose();
  };

  const damage = () => {
    const result = applyDamage(s.character, amount);
    s.update(() => result.character);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const notes: string[] = [];
    if (result.instantDeath) notes.push('Massive damage: the remaining damage equals your hit point maximum. That is instant death.');
    else if (currentHp(result.character) === 0) notes.push('You drop to 0 HP and fall unconscious. Start making death saving throws.');
    if (result.concentrationDc) {
      const spell = content.spells.find(s.character.play.concentration!)?.name ?? 'your spell';
      notes.push(`Concentration: make a DC ${result.concentrationDc} Constitution save to keep ${spell}.`);
    }
    done(notes.join('\n\n') || undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.pad, { paddingBottom: insets.bottom + space.lg }]}>
        {notice ? (
          <View style={{ gap: space.lg }}>
            <Text style={styles.notice}>{notice}</Text>
            <PadButton label="OK" color={s.color} onPress={() => { setNotice(undefined); onClose(); }} />
          </View>
        ) : (
          <>
            <Text style={styles.entry} accessibilityLiveRegion="polite">{entry || '0'}</Text>
            <View style={styles.keys}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'].map((k) => (
                <Pressable key={k} accessibilityRole="button" accessibilityLabel={k === '⌫' ? 'Delete' : k} onPress={() => press(k)} style={({ pressed }) => [styles.key, pressed && { backgroundColor: '#2A231D' }]}>
                  <Text style={styles.keyText}>{k}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.actions}>
              <PadButton label="Damage" color={HURT} disabled={!amount} onPress={damage} />
              <PadButton label="Heal" color={HEALED} disabled={!amount} onPress={() => { s.update((c) => heal(c, amount)); done(); }} />
              <PadButton label="Temp HP" color={s.color} disabled={!amount} onPress={() => { s.update((c) => setTempHp(c, amount)); done(); }} />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

function PadButton({ label, color, onPress, disabled }: { label: string; color: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, { backgroundColor: color, opacity: disabled ? 0.35 : pressed ? 0.8 : 1 }]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, gap: 4, minHeight: 44 },
  numbers: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  hp: { fontFamily: fonts.display, fontSize: 34, color: palettes.dark.ink, fontVariant: ['tabular-nums'] },
  max: { fontFamily: fonts.body, fontSize: 16, color: palettes.dark.inkMuted },
  temp: { fontFamily: fonts.bodyBold, fontSize: 13 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#2A231D', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  caption: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.3, color: palettes.dark.inkMuted },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  pad: { backgroundColor: '#1B1612', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: space.lg, gap: space.md },
  entry: { fontFamily: fonts.display, fontSize: 48, color: palettes.dark.ink, textAlign: 'center', fontVariant: ['tabular-nums'] },
  keys: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  key: { width: '30%', height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palettes.dark.rule },
  keyText: { fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1, minHeight: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 16, color: palettes.dark.table },
  notice: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: palettes.dark.ink },
});
