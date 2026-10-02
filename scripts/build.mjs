import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
await build({ entryPoints: ['src/index.ts'], outfile: 'dist/index.js', bundle: true, format: 'esm',
  platform: 'browser', target: 'es2020', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
await writeFile('dist/styles.css.d.ts', 'export {};\n');
