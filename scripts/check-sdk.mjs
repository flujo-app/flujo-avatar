import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

await mkdir('artifacts', { recursive: true });
const consumer = await mkdtemp(resolve('artifacts/sdk-consumer-'));
const env = {};
for (const name of ['PATH', 'SystemRoot', 'TEMP', 'TMP', 'APPDATA', 'LOCALAPPDATA']) {
  if (process.env[name]) env[name] = process.env[name];
}
await writeFile(resolve(consumer, '.npmrc'), 'audit=false\nfund=false\n');
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run this check through npm run check:sdk.');
const run = (args, cwd = consumer) => execFileSync(process.execPath, args, { cwd, env, encoding: 'utf8', stdio: 'pipe' });
const packed = JSON.parse(run([npm, 'pack', './packages/avatar-sdk', '--ignore-scripts', '--json', '--pack-destination', consumer], process.cwd()))[0];
await writeFile(resolve(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
run([npm, 'install', resolve(consumer, packed.filename), '--offline', '--ignore-scripts', '--legacy-peer-deps', '--userconfig', resolve(consumer, '.npmrc')]);
const installed = resolve(consumer, 'node_modules/@flujo-ai/avatar-sdk');
const provenance = JSON.parse(await readFile(resolve(installed, 'PROVENANCE.json'), 'utf8'));
for (const [name, expected] of Object.entries(provenance.files)) {
  if (createHash('sha256').update(await readFile(resolve(installed, name))).digest('hex') !== expected) throw new Error(`SDK member changed: ${name}`);
}
await writeFile(resolve(consumer, 'check.ts'), `
import { Eyes, WorldScene, FactoryAvatar, type AvatarWorldSnapshot } from '@flujo-ai/avatar-sdk';
import { useNativeRouterVoice, usePocketSpeech, type NativeVoiceTransport } from '@flujo-ai/avatar-sdk/native-voice';
import { synthesizePocket } from '@flujo-ai/avatar-sdk/server/pocket-speech';
import '@flujo-ai/avatar-sdk/styles.css';
import '@flujo-ai/avatar-sdk/world.css';
const transport: NativeVoiceTransport = { scopeKey: 'host-fixture', workletUrl: '/avatar-audio-capture.js', request: async () => new Response() };
const snapshot: AvatarWorldSnapshot = { checkedAt: 1, workModel: null, objects: [], unavailable: [], truncated: [] };
void [Eyes, WorldScene, FactoryAvatar, useNativeRouterVoice, usePocketSpeech, synthesizePocket, transport, snapshot];
`);
run([resolve('node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler', '--jsx', 'react-jsx', 'check.ts']);
await writeFile(resolve(consumer, 'check.mjs'), `
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Eyes, WorldScene } from '@flujo-ai/avatar-sdk';
import { useNativeRouterVoice, usePocketSpeech, snapshotNativeVoiceTransport } from '@flujo-ai/avatar-sdk/native-voice';
import { pocketOrigin } from '@flujo-ai/avatar-sdk/server/pocket-speech';
globalThis.fetch = () => { throw new Error('Passive SDK import must not fetch'); };
assert.match(renderToStaticMarkup(createElement(Eyes, { avatar: 'moss', phase: 'idle' })), /eyes_eyes/);
assert.match(renderToStaticMarkup(createElement(WorldScene, { snapshot: null, phase: 'idle', level: 0, exploring: false })), /canvas/);
assert.equal(typeof useNativeRouterVoice, 'function');
assert.equal(typeof usePocketSpeech, 'function');
assert.equal(pocketOrigin('http://127.0.0.1:43947'), 'http://127.0.0.1:43947');
const binding = { scopeKey: 'one', workletUrl: '/capture.js', request: async () => new Response() };
const captured = snapshotNativeVoiceTransport(binding); binding.scopeKey = 'two';
assert.equal(captured.scopeKey, 'one');
console.log('Packed SDK: installed exports, declarations, passive rendering, captured transport and provenance passed.');
`);
console.log(run(['check.mjs']).trim());
