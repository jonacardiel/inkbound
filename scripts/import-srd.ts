/**
 * Imports the 2014 SRD 5.1 JSON from a local checkout of 5e-bits/5e-database
 * into compact app JSON under src/content/data/.
 *
 *   git clone https://github.com/5e-bits/5e-database.git <dir>
 *   git -C <dir> checkout <commit>        # see SRD_COMMIT below
 *   npx tsx scripts/import-srd.ts <dir>
 *
 * Transformations:
 * - API references ({ index, name, url }) become plain id strings.
 * - `url` fields are dropped and keys are camelCased.
 * - Every SRD choice object ({ choose, type, from }) becomes a `SrdChoice`
 *   (see src/content/types.ts).
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRD_COMMIT = 'bce51b3958573819e3b842fbc0cd9524fe4bc2e1';

const FILES: Record<string, string> = {
  'ability-scores': 'Ability-Scores',
  alignments: 'Alignments',
  backgrounds: 'Backgrounds',
  classes: 'Classes',
  conditions: 'Conditions',
  'damage-types': 'Damage-Types',
  'equipment-categories': 'Equipment-Categories',
  equipment: 'Equipment',
  feats: 'Feats',
  features: 'Features',
  languages: 'Languages',
  levels: 'Levels',
  'magic-items': 'Magic-Items',
  'magic-schools': 'Magic-Schools',
  proficiencies: 'Proficiencies',
  races: 'Races',
  skills: 'Skills',
  spells: 'Spells',
  subclasses: 'Subclasses',
  subraces: 'Subraces',
  traits: 'Traits',
  'weapon-properties': 'Weapon-Properties',
};

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Obj = { [key: string]: Json };

const camel = (key: string) => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

const isObj = (v: Json): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function isReference(o: Obj): boolean {
  return (
    typeof o.index === 'string' &&
    typeof o.url === 'string' &&
    Object.keys(o).every((k) => k === 'index' || k === 'name' || k === 'url')
  );
}

function refId(v: Json): string {
  if (!isObj(v) || typeof v.index !== 'string') throw new Error(`Expected reference, got ${JSON.stringify(v)}`);
  return v.index;
}

function normalizeOption(o: Json): Json {
  // Ranger's favored enemy / terrain lists are bare strings.
  if (typeof o === 'string') return { kind: 'string', value: o };
  if (!isObj(o)) throw new Error(`Unexpected option ${JSON.stringify(o)}`);
  switch (o.option_type) {
    case 'reference':
      return { kind: 'ref', id: refId(o.item) };
    case 'counted_reference': {
      const out: Obj = { kind: 'counted', id: refId(o.of), count: o.count };
      if (o.prerequisites) out.prerequisites = transform(o.prerequisites);
      return out;
    }
    case 'multiple':
      return { kind: 'multiple', items: (o.items as Json[]).map(normalizeOption) };
    case 'choice':
      return { kind: 'choice', choice: normalizeChoice(o.choice as Obj) };
    case 'string':
      return { kind: 'string', value: o.string };
    case 'ideal':
      return { kind: 'ideal', desc: o.desc, alignments: (o.alignments as Json[]).map(refId) };
    case 'score_prerequisite':
      return { kind: 'scorePrerequisite', ability: refId(o.ability_score), minimum: o.minimum_score };
    case 'ability_bonus':
      return { kind: 'abilityBonus', ability: refId(o.ability_score), bonus: o.bonus };
    default:
      throw new Error(`Unknown option_type ${String(o.option_type)}`);
  }
}

function normalizeChoice(c: Obj): Json {
  const from = c.from as Obj;
  let options: Json;
  switch (from.option_set_type) {
    case 'options_array':
      options = { kind: 'options', options: (from.options as Json[]).map(normalizeOption) };
      break;
    case 'equipment_category':
      options = { kind: 'equipmentCategory', id: refId(from.equipment_category) };
      break;
    case 'resource_list':
      // Only used for "any languages"; the URL names the resource.
      options = { kind: 'resourceList', resource: String(from.resource_list_url).split('/').pop()! };
      break;
    default:
      throw new Error(`Unknown option_set_type ${String(from.option_set_type)}`);
  }
  const out: Obj = { choose: c.choose, type: c.type, from: options };
  if (typeof c.desc === 'string') out.desc = c.desc;
  return out;
}

function transform(v: Json): Json {
  if (Array.isArray(v)) return v.map(transform);
  if (!isObj(v)) return v;
  if (isReference(v)) return v.index;
  if ('choose' in v && 'from' in v) return normalizeChoice(v);
  const out: Obj = {};
  for (const [k, val] of Object.entries(v)) {
    if (k === 'url' || k === '_id') continue;
    out[camel(k)] = transform(val);
  }
  return out;
}

function main() {
  const repo = process.argv[2];
  if (!repo) throw new Error('Usage: npx tsx scripts/import-srd.ts <path-to-5e-database>');

  const head = execSync('git rev-parse HEAD', { cwd: repo }).toString().trim();
  if (head !== SRD_COMMIT) {
    console.warn(`warning: checkout is at ${head}, expected pinned ${SRD_COMMIT}`);
  }

  const srcDir = join(repo, 'src', '2014', 'en');
  const outDir = resolve(__dirname, '..', 'src', 'content', 'data');
  mkdirSync(outDir, { recursive: true });

  for (const [out, name] of Object.entries(FILES)) {
    const raw = JSON.parse(readFileSync(join(srcDir, `5e-SRD-${name}.json`), 'utf8')) as Json;
    const data = transform(raw);
    writeFileSync(join(outDir, `${out}.json`), JSON.stringify(data));
    console.log(`${out}.json  ${(data as Json[]).length} entries`);
  }

  writeFileSync(
    join(outDir, 'source.json'),
    JSON.stringify(
      {
        source: 'https://github.com/5e-bits/5e-database',
        commit: head,
        attribution:
          'This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.',
      },
      null,
      2,
    ) + '\n',
  );
}

main();
