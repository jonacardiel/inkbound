import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import type { Character } from '@/rules/character';
import { backupFileName, toBackup } from '@/state/backup';
import { useCharacters } from '@/state/characters';
import { saveJson } from '@/state/files';
import { fonts, palettes, space } from '@/ui/theme';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Long-press menu for a hero on the roster: open, duplicate, back up, delete (with confirmation). */
export function HeroActions({ character, color, onClose }: { character?: Character; color: string; onClose: () => void }) {
  const save = useCharacters((s) => s.save);
  const remove = useCharacters((s) => s.remove);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string>();
  if (!character) return null;

  const close = () => {
    setConfirmDelete(false);
    setMessage(undefined);
    onClose();
  };

  const actions = confirmDelete
    ? [
        {
          label: `Delete ${character.name} forever`,
          danger: true,
          run: () => {
            remove(character.id);
            close();
          },
        },
        { label: 'Keep them', run: () => setConfirmDelete(false) },
      ]
    : [
        { label: 'Open character sheet', run: () => (close(), router.push(`/character/${character.id}` as Href)) },
        {
          label: 'Duplicate',
          run: () => {
            save({ ...character, id: newId(), name: `${character.name} (copy)` });
            close();
          },
        },
        {
          label: 'Save a backup file',
          run: async () => {
            try {
              await saveJson(backupFileName([character]), JSON.stringify(toBackup([character]), null, 2));
              close();
            } catch (e) {
              setMessage((e as Error).message);
            }
          },
        },
        { label: 'Delete…', danger: true, run: () => setConfirmDelete(true) },
      ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close menu">
        <Pressable style={[styles.sheet, { borderColor: confirmDelete ? '#C23B3B' : color }]} onPress={() => undefined}>
          <Text style={styles.title}>{character.name}</Text>
          {confirmDelete ? (
            <Text style={styles.warning}>{"This can't be undone. Save a backup file first if you might want them back."}</Text>
          ) : null}
          {actions.map((a) => (
            <Pressable
              key={a.label}
              accessibilityRole="button"
              onPress={a.run}
              style={({ pressed }) => [styles.action, a.danger && confirmDelete && styles.danger, pressed && { opacity: 0.7 }]}>
              <Text style={[styles.actionText, a.danger && { color: confirmDelete ? palettes.dark.ink : '#E0605A' }]}>{a.label}</Text>
            </Pressable>
          ))}
          {message ? <Text style={styles.warning}>{message}</Text> : null}
          {!confirmDelete ? (
            <Pressable accessibilityRole="button" onPress={close} style={styles.action}>
              <Text style={[styles.actionText, { color: palettes.dark.inkMuted }]}>Cancel</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  sheet: { width: '100%', maxWidth: 400, backgroundColor: '#1B1612', borderRadius: 12, borderWidth: 1.5, padding: space.lg, gap: space.sm },
  title: { fontFamily: fonts.display, fontSize: 24, color: palettes.dark.ink, marginBottom: space.xs },
  warning: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: '#E0A09A' },
  action: { minHeight: 48, borderRadius: 8, justifyContent: 'center', paddingHorizontal: space.md, borderWidth: 1, borderColor: palettes.dark.rule },
  danger: { backgroundColor: '#8E2F2F', borderColor: '#C23B3B' },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 16, color: palettes.dark.ink },
});
