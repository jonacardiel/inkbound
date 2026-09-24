import { Stack } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import source from '@/content/data/source.json';
import { useDiceSettings, type DiceAnimation } from '@/sheet/rolls';
import { backupFileName, parseBackup, toBackup } from '@/state/backup';
import { useCharacters } from '@/state/characters';
import { openJson, saveJson } from '@/state/files';
import { fonts, palettes, space } from '@/ui/theme';

const ANIMATIONS: { id: DiceAnimation; label: string; hint: string }[] = [
  { id: 'full', label: '3D dice', hint: 'Dice are thrown on screen' },
  { id: 'quick', label: 'Quick', hint: 'A short result popup' },
  { id: 'off', label: 'Off', hint: 'Just the result' },
];

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export default function Settings() {
  const { animation, setAnimation, sound, setSound } = useDiceSettings();
  const characters = useCharacters((s) => s.characters);
  const save = useCharacters((s) => s.save);
  const [status, setStatus] = useState<{ ok: boolean; text: string }>();
  const party = Object.values(characters);

  const exportAll = async () => {
    try {
      await saveJson(backupFileName(party), JSON.stringify(toBackup(party), null, 2));
      setStatus({ ok: true, text: `Backup of ${party.length} ${party.length === 1 ? 'hero' : 'heroes'} ready to save.` });
    } catch (e) {
      setStatus({ ok: false, text: (e as Error).message });
    }
  };

  const importFile = async () => {
    try {
      const text = await openJson();
      if (text === undefined) return;
      const result = parseBackup(text, new Set(Object.keys(characters)), newId);
      result.characters.forEach(save);
      const added = result.characters.map((c) => c.name).join(', ');
      const skipped = result.skipped.map((s) => `${s.name} (${s.reason})`).join(', ');
      setStatus({
        ok: result.characters.length > 0,
        text: [added && `Imported: ${added}.`, skipped && `Skipped: ${skipped}.`].filter(Boolean).join(' '),
      });
    } catch (e) {
      setStatus({ ok: false, text: (e as Error).message });
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <Section title="Dice">
        <View style={styles.segment} accessibilityRole="radiogroup">
          {ANIMATIONS.map((a) => (
            <Pressable
              key={a.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: animation === a.id }}
              accessibilityHint={a.hint}
              onPress={() => setAnimation(a.id)}
              style={[styles.segmentItem, animation === a.id && styles.segmentOn]}>
              <Text style={[styles.segmentText, animation === a.id && { color: palettes.dark.table }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.small}>{ANIMATIONS.find((a) => a.id === animation)!.hint}. If your device has Reduce Motion on, dice always use the quick popup.</Text>
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: sound }} onPress={() => setSound(!sound)} style={styles.row}>
          <Text style={styles.rowText}>Dice sounds</Text>
          <Text style={[styles.toggle, sound && styles.toggleOn]}>{sound ? 'On' : 'Off'}</Text>
        </Pressable>
      </Section>

      <Section title="Backups">
        <Text style={styles.small}>
          Your heroes are saved only on this device. Keep a backup file somewhere safe (Files, Drive, email) so you can restore them on a new or reset phone.
        </Text>
        <Button label={`Back up all ${party.length} ${party.length === 1 ? 'hero' : 'heroes'}`} onPress={exportAll} disabled={!party.length} />
        <Button label="Restore from a backup file" onPress={importFile} />
        {status ? <Text style={[styles.small, { color: status.ok ? '#8FBF6F' : '#E0605A' }]}>{status.text}</Text> : null}
        <Text style={styles.small}>Restoring adds heroes; it never replaces the ones you have. Photo portraits stay on the phone they were taken on.</Text>
      </Section>

      <Section title="Credits & licenses">
        <Credit title="Rules content">{source.attribution}</Credit>
        <Credit title="Rules content (2024)">
          This work includes material from the System Reference Document 5.2 (&ldquo;SRD 5.2&rdquo;) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode. Used here: the Criminal, Sage and Soldier backgrounds and their origin feats, adapted.
        </Credit>
        <Credit title="Rules data" link="https://github.com/5e-bits/5e-database">
          Structured SRD data from the 5e-database project by 5e-bits (MIT License).
        </Credit>
        <Credit title="Fonts">
          Old Standard TT by the Old Standard Project Authors, and Atkinson Hyperlegible by the Braille Institute of America. Both under the SIL Open Font License 1.1.
        </Credit>
        <Credit title="Dice sounds" link="https://kenney.nl/assets/casino-audio">
          Casino Audio by Kenney (kenney.nl), public domain (CC0).
        </Credit>
        <Credit title="Artwork">Illustrations were created for this app with AI image generation, in an engraving style inspired by 19th-century book illustration.</Credit>
        <Text style={styles.small}>This app is an unofficial fan tool, not affiliated with or endorsed by Wizards of the Coast.</Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Button({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function Credit({ title, children, link }: { title: string; children: React.ReactNode; link?: string }) {
  return (
    <View style={styles.credit}>
      <Text style={styles.creditTitle}>{title}</Text>
      <Text style={styles.small}>{children}</Text>
      {link ? (
        <Text accessibilityRole="link" onPress={() => Linking.openURL(link)} style={styles.link}>
          {link.replace(/^https:\/\//, '')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palettes.dark.table },
  body: { padding: space.lg, paddingBottom: 64, gap: space.xl, maxWidth: 680, width: '100%', alignSelf: 'center' },
  section: { gap: space.md },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: palettes.dark.ink },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: palettes.dark.inkMuted },
  segment: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: palettes.dark.rule, overflow: 'hidden' },
  segmentItem: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: palettes.dark.accent },
  segmentText: { fontFamily: fonts.bodyBold, fontSize: 15, color: palettes.dark.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  rowText: { fontFamily: fonts.bodyBold, fontSize: 16, color: palettes.dark.ink },
  toggle: {
    minWidth: 56,
    textAlign: 'center',
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palettes.dark.rule,
    fontFamily: fonts.bodyBold,
    color: palettes.dark.inkMuted,
    overflow: 'hidden',
  },
  toggleOn: { backgroundColor: palettes.dark.accent, borderColor: palettes.dark.accent, color: palettes.dark.table },
  button: { minHeight: 50, borderRadius: 8, borderWidth: 1.5, borderColor: palettes.dark.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 16, color: palettes.dark.accent },
  credit: { gap: 4, borderLeftWidth: 2, borderLeftColor: palettes.dark.rule, paddingLeft: space.md },
  creditTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: palettes.dark.ink },
  link: { fontFamily: fonts.body, fontSize: 14, color: palettes.dark.accent, textDecorationLine: 'underline' },
});
