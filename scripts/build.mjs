import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { verifyCanonicalWorldInputs } from './canonical-world-inputs.mjs';
await verifyCanonicalWorldInputs();
await build({ entryPoints: ['src/index.ts'], outfile: 'dist/index.js', bundle: true, format: 'esm',
  platform: 'browser', target: 'es2020', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
await writeFile('dist/styles.css.d.ts', 'export {};\n');
await build({ entryPoints: ['src/world/index.ts'], outfile: 'dist/world.js', bundle: true, format: 'esm',
  platform: 'browser', target: 'es2020', jsx: 'automatic', tsconfig: 'tsconfig.package.json',
  external: ['react', 'react/jsx-runtime'], banner: { js: "'use client';" } });
await writeFile('dist/world.css.d.ts', 'export {};\n');
await build({ entryPoints: ['src/sdk/index.ts'], outfile: 'dist/sdk.js', bundle: true, format: 'esm',
  platform: 'browser', target: 'es2020', jsx: 'automatic', tsconfig: 'tsconfig.package.json',
  external: ['react', 'react/jsx-runtime'], banner: { js: "'use client';" } });
