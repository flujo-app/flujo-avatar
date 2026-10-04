import assert from 'node:assert/strict';
import test from 'node:test';
import { createAcceptedTaskNarrationTransport, type AcceptedTaskNarrationBinding } from '../src/client/acceptedTaskNarrationTransport';
import type { NativeVoiceTransport, AvatarVoiceEndpoint } from '../src/client/nativeVoiceTransport';

const taskId = '12345678-1234-4123-8123-123456789abc';
const otherTask = '851c7894-e783-4051-a939-48ae7d7bc447';
function fixture() {
  const ordinary: Array<{ endpoint: AvatarVoiceEndpoint; init: RequestInit }> = [];
  const narration: RequestInit[] = [];
  let selected: string | null = taskId;
  let response = new Response('fixture stream', { headers: { 'Content-Type': 'application/x-ndjson' } });
  const base: NativeVoiceTransport = { scopeKey: 'owner:workspace:revision-1', workletUrl: '/fixture-worklet.js',
    request: async (endpoint, init) => { ordinary.push({ endpoint, init }); return new Response('{}'); } };
  const binding: AcceptedTaskNarrationBinding = { revision: 'qualified-host-fixture-1',
    selectedTaskId: () => selected,
    postNarration: async init => { narration.push(init); return response; } };
  return { base, binding, ordinary, narration, select: (id: string | null) => { selected = id; },
    respond: (value: Response) => { response = value; } };
}
const input = (extra = {}): RequestInit => ({ method: 'POST', body: JSON.stringify({ taskId, locale: 'en', avatar: 'spark', ...extra }) });

test('default stays disabled and neither result path falls through to the base transport', async () => {
  const f = fixture(), adapter = createAcceptedTaskNarrationTransport(f.base);
  await assert.rejects(adapter.request('native-result', input()), /narration_transport_disabled/);
  await assert.rejects(adapter.request('native-result-receipt', input()), /narration_receipt_route_disabled/);
  assert.equal(f.ordinary.length, 0); assert.equal(f.narration.length, 0);
  assert.equal(Object.isFrozen(adapter), true);
});

test('selected task emits only UUID and exact locale, with no client-selected avatar', async () => {
  const f = fixture(), adapter = createAcceptedTaskNarrationTransport(f.base, f.binding);
  for (const locale of ['en', 'es', 'pt']) {
    await adapter.request('native-result', input({ locale, avatar: 'untrusted-avatar' }));
    assert.deepEqual(JSON.parse(f.narration.at(-1)!.body as string), { taskId, locale });
    assert.equal(new Headers(f.narration.at(-1)!.headers).get('Content-Type'), 'application/json');
  }
  assert.equal(f.ordinary.length, 0);
  await assert.rejects(adapter.request('native-result-receipt', input()), /narration_receipt_route_disabled/);
  assert.equal(f.narration.length, 3);
});

test('private facts, authority and receipt references cannot become narration input', async () => {
  const f = fixture(), adapter = createAcceptedTaskNarrationTransport(f.base, f.binding);
  for (const key of ['authority', 'output', 'conversationId', 'messageId', 'digest', 'receiptId', 'namespace']) {
    await assert.rejects(adapter.request('native-result', input({ [key]: 'fixture-private-value' })), /invalid_narration_selection/);
  }
  assert.equal(f.narration.length, 0); assert.equal(f.ordinary.length, 0);
});

test('invalid primitive selection, locale, method and serialized body refuse before sending', async () => {
  const f = fixture(), adapter = createAcceptedTaskNarrationTransport(f.base, f.binding);
  const values: RequestInit[] = [
    input({ taskId: 'not-a-uuid' }), input({ taskId: { value: taskId } }),
    input({ taskId: taskId.replace('-4', '-5') }), input({ locale: 'EN' }), input({ locale: 'pt-BR' }),
    input({ locale: ['en'] }), { ...input(), method: 'GET' }, { method: 'POST', body: '[]' },
    { method: 'POST', body: 'null' }, { method: 'POST', body: '{' }, { method: 'POST' },
    { method: 'POST', body: ' '.repeat(8193) },
  ];
  for (const value of values) await assert.rejects(adapter.request('native-result', value), /invalid_narration_selection/);
  assert.equal(f.narration.length, 0);
});

test('removed or replaced selection cannot narrate a queued old result', async () => {
  const f = fixture(), adapter = createAcceptedTaskNarrationTransport(f.base, f.binding);
  f.select(null); await assert.rejects(adapter.request('native-result', input()), /narration_selection_changed/);
  f.select(otherTask); await assert.rejects(adapter.request('native-result', input()), /narration_selection_changed/);
  assert.equal(f.narration.length, 0);
  await adapter.request('native-result', input({ taskId: otherTask }));
  assert.equal(f.narration.length, 1);
});

test('scope distinguishes qualification revisions and captures callbacks without later replacement', async () => {
  const f = fixture(), adapter = createAcceptedTaskNarrationTransport(f.base, f.binding);
  const disabled = createAcceptedTaskNarrationTransport(f.base);
  const next = createAcceptedTaskNarrationTransport(f.base, { ...f.binding, revision: 'qualified-host-fixture-2' });
  assert.notEqual(adapter.scopeKey, disabled.scopeKey); assert.notEqual(adapter.scopeKey, next.scopeKey);
  const changed = f.binding as { revision: string; selectedTaskId: () => string | null; postNarration: (init: RequestInit) => Promise<Response> };
  changed.revision = 'mutated'; changed.postNarration = async () => { throw new Error('replacement'); };
  changed.selectedTaskId = () => null;
  await adapter.request('native-result', input()); assert.equal(f.narration.length, 1);
  assert.equal(adapter.workletUrl, '/fixture-worklet.js');
});

test('scope encoding keeps delimiter-containing identities separate and rejects invalid bindings', () => {
  const f = fixture();
  const a = createAcceptedTaskNarrationTransport({ ...f.base, scopeKey: 'a:b' }, { ...f.binding, revision: 'c' });
  const b = createAcceptedTaskNarrationTransport({ ...f.base, scopeKey: 'a' }, { ...f.binding, revision: 'b:c' });
  assert.notEqual(a.scopeKey, b.scopeKey);
  assert.throws(() => createAcceptedTaskNarrationTransport(f.base, { ...f.binding, revision: '' }), /invalid_narration_binding/);
  assert.throws(() => createAcceptedTaskNarrationTransport({ ...f.base, scopeKey: 'x'.repeat(512) }), /invalid_narration_binding/);
});

test('ordinary voice actions retain the captured transport and their exact request', async () => {
  const f = fixture(), adapter = createAcceptedTaskNarrationTransport(f.base);
  const init: RequestInit = { method: 'POST', body: '{}', signal: new AbortController().signal };
  await adapter.request('native-reset', init);
  assert.equal(f.ordinary[0].init, init); assert.equal(f.ordinary[0].endpoint, 'native-reset');
});

test('holds and NDJSON are returned unchanged, stream cancellation and abort stay host-owned', async () => {
  const f = fixture(), adapter = createAcceptedTaskNarrationTransport(f.base, f.binding);
  const hold = new Response('{"error":"fixture-only-hold"}', { status: 409 }); f.respond(hold);
  assert.equal(await adapter.request('native-result', input()), hold);
  let cancelled = 0;
  const stream = new Response(new ReadableStream({ cancel: () => { cancelled++; } }), { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' } });
  f.respond(stream); const controller = new AbortController();
  assert.equal(await adapter.request('native-result', { ...input(), signal: controller.signal }), stream);
  assert.equal(f.narration.at(-1)!.signal, controller.signal);
  await stream.body!.cancel(); assert.equal(cancelled, 1);
  controller.abort(); await assert.rejects(adapter.request('native-result', { ...input(), signal: controller.signal }), { name: 'AbortError' });
  assert.equal(f.narration.length, 2);
});
