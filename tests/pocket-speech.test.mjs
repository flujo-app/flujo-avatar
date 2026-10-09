import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pocketOrigin, pocketAvailability, synthesizePocket, validatePocketSpeech, POCKET_VOICES } from '../src/server/pocket-speech.mjs';
function wav() {
  const data = Buffer.alloc(48); data.write('RIFF'); data.writeUInt32LE(40, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(24000, 24);
  data.writeUInt32LE(48000, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(4, 40); return data;
}
test('only operator-owned loopback origin, bounded text and preset languages are admitted', () => {
  assert.equal(POCKET_VOICES.en, 'anna');
  for (const origin of ['https://example.com', 'http://localhost:43947', 'http://127.0.0.1:43947/private', 'http://secret@127.0.0.1:43947', 'http://127.0.0.1:43947/?x=1']) assert.throws(() => pocketOrigin(origin));
  assert.equal(pocketOrigin('http://127.0.0.1:43947'), 'http://127.0.0.1:43947');
  for (const value of [{ text: 'x', locale: 'xx' }, { text: 'x'.repeat(601), locale: 'en' }, { text: 'x', locale: 'en', voice: '/private/file.wav' }, { text: '\0', locale: 'en' }]) assert.throws(() => validatePocketSpeech(value));
});
test('health requires a loaded pinned worker; configuration is not readiness', async () => {
  assert.equal(await pocketAvailability(undefined), false);
  assert.equal(await pocketAvailability('http://127.0.0.1:43947', async () => Response.json({ ready: false, engine: 'pocket-tts', version: '3.3.0' })), false);
  assert.equal(await pocketAvailability('http://127.0.0.1:43947', async () => Response.json({ ready: true, engine: 'pocket-tts', version: '3.3.0' })), true);
});
test('synthesis forwards no credential, validates PCM and propagates cancellation', async () => {
  const controller = new AbortController();
  const output = await synthesizePocket({ text: 'Hello', locale: 'en' }, 'http://127.0.0.1:43947', async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:43947/speech');
    assert.deepEqual(options.headers, { 'content-type': 'application/json' });
    assert.deepEqual(JSON.parse(options.body), { text: 'Hello', locale: 'en' });
    controller.abort(); assert.equal(options.signal.aborted, true);
    return new Response(wav());
  }, controller.signal);
  assert.equal(output.length, 48);
  for (const bytes of [Buffer.from('bad'), Buffer.alloc(1500000), (() => { const b=wav(); b.writeUInt32LE(22050,24); return b; })()])
    await assert.rejects(synthesizePocket({ text: 'Hello', locale: 'en' }, 'http://127.0.0.1:43947', async () => new Response(bytes)));
});
