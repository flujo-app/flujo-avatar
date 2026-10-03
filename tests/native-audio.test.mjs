import test from 'node:test';
import assert from 'node:assert/strict';
import { streamNativeTurn, validateNativeTurn } from '../src/server/openrouter-native.mjs';
const value = { message: 'Ayúdame a conectar mi IA.', avatar: 'moss', locale: 'es' };
const frame = delta => ({ id: 'fixed-stream', model: 'openai/gpt-audio', choices: [{ index: 0, delta, finish_reason: null }] });
const speech = () => frame({ audio: { id: 'fixed-audio', data: Buffer.from([1, 0, 2, 0]).toString('base64'), transcript: 'Estoy contigo.' } });
const expiry = () => frame({ audio: { expires_at: 2000000000 } });
const usage = () => ({ choices: [], usage: { prompt_tokens: 100, completion_tokens: 100, total_tokens: 200, cost: 0.006, prompt_tokens_details: { audio_tokens: 40 }, completion_tokens_details: { audio_tokens: 80 } } });
const provider = events => new Response(events.map(event => 'data: ' + (typeof event === 'string' ? event : JSON.stringify(event)) + '\n\n').join(''), { headers: { 'Content-Type': 'text/event-stream' } });
async function run(events, options = {}) {
  const output = [], signal = options.signal ?? new AbortController().signal;
  const result = await streamNativeTurn(options.value ?? value, { openrouterKey: 'TEST_ONLY' }, options.fetch ?? (() => provider(events)), signal,
    options.emit ?? (event => { output.push(event); }), { turnId: 'turn_1', ...options.context });
  return { result, output };
}
test('provider audio qualifies only after terminal marker, usage, DONE and EOF', async () => {
  const qualified = [];
  const good = await run([speech(), expiry(), usage(), '[DONE]'], { context: { onQualifiedResult: result => qualified.push(result) } });
  assert.equal(good.result.completed, true); assert.equal(qualified.length, 1);
  assert.deepEqual(good.output.map(event => event.type), ['start', 'caption', 'audio', 'complete']);
  for (const events of [[speech(), expiry(), usage()], [speech(), usage(), '[DONE]'], [speech(), expiry(), '[DONE]']]) {
    const failed = await run(events); assert.equal(failed.result.completed, false); assert.equal(failed.output.at(-1).type, 'error');
  }
});
test('transport stays native and excludes work tools, browser results, keys and routing overrides', async () => {
  for (const extra of [{ history: [] }, { backendResult: { reply: 'invented success' } }, { model: 'other' }, { tools: [] }]) assert.throws(() => validateNativeTurn({ ...value, ...extra }));
  await run([], { fetch: (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(body.model, 'openai/gpt-audio'); assert.equal(body.tools, undefined);
    assert.deepEqual(body.modalities, ['text', 'audio']); assert.equal(body.audio.format, 'pcm16');
    assert.deepEqual(body.provider.only, ['openai']);
    assert.match(body.messages[0].content, /selected work AI handles that/);
    assert.ok(!JSON.stringify(body).includes('TEST_ONLY'));
    return provider([speech(), expiry(), usage(), '[DONE]']);
  } });
});
test('voice requests without a locale use English throughout the provider request', async () => {
  const input = { message: 'Help me connect my AI.', avatar: 'moss' };
  await run([], { value: input, fetch: (_url, options) => {
    const body = JSON.parse(options.body);
    assert.match(body.messages[0].content, /Speak natural, clear English/);
    return provider([speech(), expiry(), usage(), '[DONE]']);
  } });
});
test('stream failure feedback follows English, Spanish and Portuguese explicitly', async () => {
  for (const [locale, expected] of [['en', /The voice response could not be completed/], ['es', /La respuesta de voz no se pudo completar/], ['pt', /A resposta de voz não pôde ser concluída/]]) {
    const failed = await run([speech(), usage(), '[DONE]'], { value: { ...value, locale } });
    assert.equal(failed.result.completed, false);
    assert.match(failed.output.at(-1).error, expected);
  }
});
test('server-provided setup facts and results remain bounded quoted data in every locale', async () => {
  for (const locale of ['es', 'pt', 'en']) {
    await run([], { value: { ...value, locale }, context: { setupFacts: '{"workAI":null}', backendResult: { reply: 'Recorded reply', mode: 'flujo', status: 'completed' } },
      fetch: (_url, options) => { const body = JSON.parse(options.body); assert.match(body.messages.at(-1).content, /Recorded reply/); assert.ok(body.messages.some(message => message.content.includes('workAI'))); return provider([speech(), expiry(), usage(), '[DONE]']); } });
  }
  await assert.rejects(() => run([], { context: { setupFacts: 'x'.repeat(4001) } }));
});
test('failed ledger qualification cannot emit complete or leak internal exception text', async () => {
  const { result, output } = await run([speech(), expiry(), usage(), '[DONE]'], { context: { onQualifiedResult() { throw new Error('PRIVATE_SENTINEL'); } } });
  assert.equal(result.completed, false); assert.ok(!output.some(event => event.type === 'complete'));
  assert.ok(!JSON.stringify(output).includes('PRIVATE_SENTINEL'));
});
test('backpressure is awaited and cancellation stops a blocked output without qualifying history', async () => {
  const controller = new AbortController(), output = [];
  const turn = run([speech(), expiry(), usage(), '[DONE]'], { signal: controller.signal, emit: event => {
    output.push(event); if (event.type === 'audio') { controller.abort(); return new Promise(() => {}); }
  } });
  const { result } = await turn; assert.equal(result.completed, false);
  assert.ok(!output.some(event => event.type === 'complete'));
});
