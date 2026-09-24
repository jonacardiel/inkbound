// Web versions: download the backup as a file, and open one with the browser's file picker.
import * as DocumentPicker from 'expo-document-picker';

export async function saveJson(fileName: string, text: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function openJson(): Promise<string | undefined> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'] });
  if (result.canceled) return undefined;
  const asset = result.assets[0];
  return asset.file ? asset.file.text() : (await fetch(asset.uri)).text();
}
