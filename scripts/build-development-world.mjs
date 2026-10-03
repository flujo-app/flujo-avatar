import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true }).trim();
const scenePin = '3d85f2df3070d1b92aea68732cdeda028d30e6ac';
const sourcePin = git('rev-parse', 'HEAD');
const development = process.argv.includes('--development');
if (!development && git('status', '--porcelain', '--untracked-files=normal')) throw new Error('clean_avatar_source_required');
const flujo = resolve(process.env.FLUJO_SCENE_CHECKOUT || join(root, 'flujo'));
const sceneRoot = join(root, '.dependency-reference', 'development-scene');
const sceneFiles = ['src/frontend/components/AvatarWorld/WorldScene.tsx', 'src/frontend/components/AvatarWorld/Watershed.tsx',
  'src/frontend/components/AvatarWorld/Eyes.tsx', 'src/frontend/components/AvatarWorld/copy.ts',
  'src/frontend/components/AvatarWorld/world.module.css', 'src/shared/types/avatar.ts'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sceneHashes = [];
for (const file of sceneFiles) {
  const bytes = execFileSync('git', ['-C', flujo, 'show', scenePin + ':' + file], { maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  const target = join(sceneRoot, file); await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes);
  sceneHashes.push({ path: file, bytes: bytes.length, sha256: sha(bytes) });
}
const output = join(root, 'artifacts', 'development-world', development ? 'development-preview' : sourcePin);
await mkdir(join(output, 'assets'), { recursive: true });
await build({ absWorkingDir: root, entryPoints: ['examples/development-world/main.tsx'], outfile: join(output, 'assets', 'app.js'),
  bundle: true, minify: true, sourcemap: false, format: 'esm', platform: 'browser', target: ['chrome120', 'safari17'],
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
  alias: { '@flujo-world': join(sceneRoot, 'src/frontend/components/AvatarWorld'), '@/vendor/avatar/client/Eyes': join(root, 'src/client/Eyes.tsx') },
  loader: { '.module.css': 'local-css' }, legalComments: 'eof', metafile: true }).then(async result => {
    const imports = Object.values(result.metafile.outputs).flatMap(o => o.imports);
    if (imports.some(i => i.external && !(i.kind === 'url-token' && (i.path.startsWith('#') || i.path.startsWith('data:image/svg+xml,'))))) {
      throw new Error('self_contained_world_required');
    }
  });
const sourceText = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
await writeFile(join(output, 'index.html'), await sourceText(join(root, 'examples/development-world/index.html')));
await writeFile(join(output, 'avatar-audio-capture.js'), await sourceText(join(root, 'public/avatar-audio-capture.js')));
await writeFile(join(output, 'PROVENANCE.json'), JSON.stringify({ version: 1, sourceRepository: 'https://github.com/flujo-app/flujo-avatar',
  sourcePin, developmentPreview: development, sceneRepository: 'https://github.com/mario-andreschak/FLUJO', scenePin, sceneFiles: sceneHashes,
  browserContract: { session: '/api/avatar/session', tasks: '/api/development/tasks', status: '/api/development/status',
    events: '/api/development/events', eventType: 'state', voice: '/api/avatar/remote/', csrfHeader: 'x-o-csrf' },
  scope: 'Static assets only; hosting, enrollment and private voice credentials belong to the coordinator.' }, null, 2) + '\n');
const files = [];
async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) {
  if (entry.isSymbolicLink()) throw new Error('artifact_symlink_refused');
  const path = join(dir, entry.name);
  if (entry.isDirectory()) await walk(path); else if (entry.isFile() && entry.name !== 'MANIFEST.json') {
    const bytes = await readFile(path); files.push({ path: relative(output, path).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha(bytes) });
  } else if (!entry.isFile()) throw new Error('artifact_type_refused');
} }
await walk(output); files.sort((a, b) => a.path.localeCompare(b.path));
const manifest = Buffer.from(JSON.stringify({ version: 1, sourcePin, scenePin, files }, null, 2) + '\n');
await writeFile(join(output, 'MANIFEST.json'), manifest);
if (!development) {
  const archive = output + '.tgz'; execFileSync('tar', ['-czf', archive, '-C', output, ...files.map(f => f.path), 'MANIFEST.json'], { windowsHide: true });
  console.log(JSON.stringify({ output, archive, sourcePin, scenePin, files: files.length, manifestSha256: sha(manifest), archiveSha256: sha(await readFile(archive)) }));
} else console.log(JSON.stringify({ output, developmentPreview: true, manifestSha256: sha(manifest) }));
