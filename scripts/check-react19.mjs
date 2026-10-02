import { build, preview } from 'vite';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = resolve(process.argv[2] || join(root, 'flujo'));
const runtime = createRequire(join(runtimeRoot, 'package.json'));
const react = runtime('react/package.json'), reactDom = runtime('react-dom/package.json');
if (!react.version.startsWith('19.') || react.version !== reactDom.version) throw new Error('Provide an installed React 19 / React DOM 19 project.');
const config = { configFile: false, root: join(root, 'examples/factory'), logLevel: 'warn',
  resolve: { alias: { 'react': dirname(runtime.resolve('react/package.json')), 'react-dom': dirname(runtime.resolve('react-dom/package.json')) } },
  build: { outDir: join(root, 'artifacts/react19-consumer'), emptyOutDir: false },
};
await build(config);
console.log(`React ${react.version} Vite consumer built successfully.`);
if (process.argv.includes('--serve')) {
  await preview({ ...config, preview: { host: '127.0.0.1', port: 43947, strictPort: true } });
  console.log('React 19 consumer: http://127.0.0.1:43947/');
}
