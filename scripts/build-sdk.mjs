import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';

const root = resolve('packages/avatar-sdk');
await mkdir(root, { recursive: true });
await cp('dist', resolve(root, 'dist'), { recursive: true });
await mkdir(resolve(root, 'public'), { recursive: true });
await cp('public/avatar-audio-capture.js', resolve(root, 'public/avatar-audio-capture.js'));
await cp('NOTICE.md', resolve(root, 'NOTICE.md'));
await mkdir(resolve(root, 'server'), { recursive: true });
for (const name of ['pocket-speech.mjs', 'pocket-speech.d.mts', 'support.mjs']) {
  await cp(`src/server/${name}`, resolve(root, 'server', name));
}
const files = {};
async function inventory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = resolve(directory, entry.name);
    if (entry.isDirectory()) await inventory(filename);
    else files[relative(root, filename).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(filename)).digest('hex');
  }
}
await inventory(resolve(root, 'dist'));
await inventory(resolve(root, 'public'));
await inventory(resolve(root, 'server'));
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sourceDirty = Boolean(execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim());
await writeFile(resolve(root, 'PROVENANCE.json'), JSON.stringify({
  repository: 'https://github.com/flujo-app/flujo-avatar', revision, sourceDirty,
  canonicalWorld: JSON.parse(await readFile('src/world/canonical/MANIFEST.json', 'utf8')), files,
}, null, 2) + '\n');
