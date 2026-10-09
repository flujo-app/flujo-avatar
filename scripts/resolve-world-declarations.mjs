import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';

// TypeScript retains source aliases in declarations. Rewrite emitted files only;
// the canonical renderer's Git blobs remain unchanged.
const aliases = new Map([
  ['@/shared/types/avatar', resolve('dist/world/canonical/src/shared/types/avatar.js')],
  ['@/vendor/avatar/client/Eyes', resolve('dist/client/Eyes.js')],
]);
async function visit(directory) {
  for (const member of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, member.name);
    if (member.isDirectory()) await visit(path);
    else if (member.name.endsWith('.d.ts')) {
      const source = await readFile(path, 'utf8');
      const output = source.replace(/(['"])(@\/(?:shared\/types\/avatar|vendor\/avatar\/client\/Eyes))\1/g,
        (_match, quote, alias) => {
          const local = relative(dirname(path), aliases.get(alias)).split(sep).join('/');
          return `${quote}${local.startsWith('.') ? local : `./${local}`}${quote}`;
        });
      if (output.includes('@/')) throw new Error(`Unresolved package declaration alias: ${path}`);
      if (output !== source) await writeFile(path, output);
    }
  }
}
await visit(resolve('dist'));
