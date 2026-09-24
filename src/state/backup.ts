// Backup files: characters exported as JSON so they survive a lost or reset phone.
import { content } from '@/content';
import type { Character } from '@/rules/character';

export const BACKUP_APP = 'dnd-companion';
export const BACKUP_VERSION = 1;

export type BackupFile = { app: typeof BACKUP_APP; version: number; exportedAt: string; characters: Character[] };

/**
 * Photos taken on this device can't travel in a text file (their path only
 * exists here), so exported characters fall back to their race's engraving.
 */
function portable(c: Character): Character {
  return c.portrait && !c.portrait.startsWith('art:') ? { ...c, portrait: undefined } : c;
}

export function toBackup(characters: Character[], now = new Date()): BackupFile {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), characters: characters.map(portable) };
}

export function backupFileName(characters: Character[], now = new Date()): string {
  const date = now.toISOString().slice(0, 10);
  const who = characters.length === 1 ? characters[0].name.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'hero' : 'party';
  return `${who}-${date}.json`;
}

/** Why a character in a file can't be imported, or undefined if it's fine. */
function problem(c: Partial<Character>): string | undefined {
  if (!c || typeof c !== 'object') return 'not a character';
  if (typeof c.name !== 'string') return 'missing a name';
  if (c.schemaVersion !== 1) return `unsupported format version ${String(c.schemaVersion)}`;
  if (!c.race || !content.races.find(c.race)) return `unknown race "${String(c.race)}"`;
  const entry = c.classes?.[0];
  if (!entry || !content.classes.find(entry.classId)) return 'unknown class';
  if (!(entry.level >= 1 && entry.level <= 20)) return 'level out of range';
  if (!c.baseScores || !c.choices || !c.play || !c.inventory || !c.currency || !c.bio) return 'incomplete character data';
  return undefined;
}

export type ImportResult = { characters: Character[]; skipped: { name: string; reason: string }[] };

/**
 * Reads a backup file (a whole party or a single character) and returns the
 * characters to add. Characters whose id is already taken get a new id, so an
 * import never overwrites anyone.
 */
export function parseBackup(text: string, existingIds: Set<string>, newId: () => string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a character backup (it isn't valid JSON).");
  }
  const list: Partial<Character>[] =
    data && typeof data === 'object' && (data as BackupFile).app === BACKUP_APP
      ? (data as BackupFile).characters
      : [data as Partial<Character>];
  if (!Array.isArray(list)) throw new Error("That file isn't a character backup.");

  const taken = new Set(existingIds);
  const result: ImportResult = { characters: [], skipped: [] };
  for (const c of list) {
    const reason = problem(c);
    if (reason) {
      result.skipped.push({ name: typeof c?.name === 'string' ? c.name : 'Unnamed', reason });
      continue;
    }
    const id = c.id && !taken.has(c.id) ? c.id : newId();
    taken.add(id);
    result.characters.push({ ...(c as Character), id });
  }
  if (!result.characters.length && !result.skipped.length) throw new Error('That backup has no characters in it.');
  return result;
}
