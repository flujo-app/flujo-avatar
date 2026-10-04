import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const sourceCommit = '3d85f2df3070d1b92aea68732cdeda028d30e6ac';
const sourcePaths = [
  'src/frontend/components/AvatarWorld/WorldScene.tsx',
  'src/frontend/components/AvatarWorld/Watershed.tsx',
  'src/frontend/components/AvatarWorld/Eyes.tsx',
  'src/frontend/components/AvatarWorld/copy.ts',
  'src/frontend/components/AvatarWorld/world.module.css',
  'src/shared/types/avatar.ts',
];
const manifestPath = resolve(root, 'src/world/canonical/MANIFEST.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export async function verifyCanonicalWorldInputs() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.sourceCommit !== sourceCommit || manifest.files.length !== sourcePaths.length)
    throw new Error('Canonical World input closure changed');
  for (const [index, sourcePath] of sourcePaths.entries()) {
    const member = manifest.files[index];
    if (member.sourcePath !== sourcePath || member.path !== `src/world/canonical/${sourcePath}`)
      throw new Error('Canonical World input path changed');
    const bytes = await readFile(resolve(root, member.path));
    if (member.bytes !== bytes.length || member.sha256 !== digest(bytes))
      throw new Error(`Canonical World bytes changed: ${sourcePath}`);
  }
  return manifest;
}

// Optional one-time import reads Git blobs, preserving LF and all renderer bytes.
// Normal builds verify tracked inputs and require no external checkout.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--import-from' && process.argv[3]) {
    const files = [];
    for (const sourcePath of sourcePaths) {
      const bytes = execFileSync('git', ['-C', process.argv[3], 'show', `${sourceCommit}:${sourcePath}`],
        { windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
      const path = `src/world/canonical/${sourcePath}`;
      await mkdir(dirname(resolve(root, path)), { recursive: true });
      await writeFile(resolve(root, path), bytes);
      files.push({ sourcePath, path, bytes: bytes.length, sha256: digest(bytes) });
    }
    await writeFile(manifestPath, `${JSON.stringify({ sourceRepository: 'https://github.com/mario-andreschak/FLUJO', sourceCommit, files }, null, 2)}\n`);
  } else if (process.argv.length > 2) throw new Error('Use --import-from <Flujo checkout> or no arguments');
  await verifyCanonicalWorldInputs();
  process.stdout.write('Canonical World: six exact source inputs verified.\n');
}
