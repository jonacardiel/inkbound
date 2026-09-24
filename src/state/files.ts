// Saving and opening backup files on phones: the share sheet (Files, Drive,
// email...) to save, and the document picker to open.
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function saveJson(fileName: string, text: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(text);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save your backup', UTI: 'public.json' });
}

/** Lets the player choose a backup file; resolves to its text, or undefined if they cancel. */
export async function openJson(): Promise<string | undefined> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled) return undefined;
  return new File(result.assets[0].uri).text();
}
