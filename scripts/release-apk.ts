/**
 * Publishes the latest finished Android EAS build as a GitHub Release.
 *
 *   npx tsx scripts/release-apk.ts "What changed in this version"
 *
 * It creates an annotated tag v<version> (or v<version>-2, -3... if that exists)
 * whose message is the build's download link plus the notes, and pushes it;
 * .github/workflows/release-apk.yml then downloads the APK and creates the release.
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const notes = process.argv[2] ?? 'A new version of Inkbound.';

type Build = { id: string; status: string; appVersion: string; artifacts?: { buildUrl?: string } };
const builds: Build[] = JSON.parse(
  execSync('npx eas-cli@latest build:list --platform android --status finished --limit 1 --json --non-interactive', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }),
);
const build = builds[0];
const url = build?.artifacts?.buildUrl;
if (!url?.endsWith('.apk')) throw new Error('No finished Android APK build found on EAS.');

const tags = new Set(execSync('git tag', { encoding: 'utf8' }).split('\n'));
let tag = `v${build.appVersion}`;
for (let n = 2; tags.has(tag); n++) tag = `v${build.appVersion}-${n}`;

const message = join(tmpdir(), 'inkbound-release-tag.txt');
writeFileSync(
  message,
  `${url}\n\n${notes}\n\n**Install:** download **Inkbound.apk** below on your Android phone and open it. Step-by-step help is in the [README](https://github.com/jonacardiel/inkbound#android-install).\n`,
);
execSync(`git tag -a ${tag} -F "${message}"`, { stdio: 'inherit' });
execSync(`git push origin ${tag}`, { stdio: 'inherit' });
console.log(`Pushed ${tag} for build ${build.id}. The release appears at https://github.com/jonacardiel/inkbound/releases in about a minute.`);
