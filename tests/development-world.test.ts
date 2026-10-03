import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSession, parseDevelopmentState, acceptObservation, Submission, rememberSubmission, restoreSubmission, forgetSubmission, runCaption } from '../src/development/protocol';
import { boundedJson, sessionRequest, voiceTransport } from '../src/development/api';

const session = { version: 1 as const, namespace: 'fixture-new-development', workspace: 'fixture-workspace', scopeKey: 'fixture-scope',
  csrfToken: 'fixture-csrf', voiceAvailable: false };
const raw = () => ({ version: 1, scope: 'o-development-v1', originalStateAdopted: false, namespace: session.namespace, workspace: session.workspace,
  admission: 'open', revision: 4, executionMode: 'tools-disabled-text-qualification', enabled: true, lastHeartbeat: 1000,
  workers: [{ id: 'worker-a', role: 'developer', ready: true, observedAt: 1000 }, { id: 'worker-b', role: 'reviewer', ready: true, observedAt: 1000 }],
  tasks: [{ id: 'task-a', client_key: 'client-a', goal: 'A fixture task', state: 'developing', created_at: 1000,
    runs: [{ id: 'run-a', role: 'developer', worker_id: 'worker-a', state: 'entered', code: null, entered_at: 1000, observed_at: null,
      output: null, evidenceSha256: null, httpPostEntered: true, attempt: 1 }] }] });

test('public session/state projection excludes arbitrary private bindings and validates namespace', () => {
  const s = parseSession({ ...session, upstreamToken: 'fixture-private' });
  assert.deepEqual(s, session);
  const v = raw(); (v.workers[0] as unknown as Record<string, unknown>).tokenFile = '/fixture/private';
  const state = parseDevelopmentState(v, session);
  assert.equal(JSON.stringify(state).includes('tokenFile'), false);
  assert.equal(JSON.stringify(state).includes('fixture-private'), false);
  assert.throws(() => parseDevelopmentState({ ...v, namespace: 'wrong' }, session));
  assert.throws(() => parseDevelopmentState({ ...v, originalStateAdopted: true }, session));
});
test('equal revisions update reported readiness; regressions keep newer state', () => {
  const first = parseDevelopmentState(raw(), session), v = raw(); v.workers[0].ready = false; v.lastHeartbeat = 2000;
  const second = parseDevelopmentState(v, session);
  assert.equal(acceptObservation(first, second), second);
  assert.equal(acceptObservation(second, { ...first, revision: 3 }), second);
  assert.equal(runCaption(first.tasks[0].runs[0]), 'Submission entered; result pending');
});
test('malformed, over-limit, duplicate or invented completion data are refused', () => {
  const v = raw();
  assert.throws(() => parseDevelopmentState({ ...v, tasks: [...v.tasks, ...v.tasks] }, session));
  assert.throws(() => parseDevelopmentState({ ...v, revision: -1 }, session));
  v.tasks[0].runs[0].state = 'complete'; assert.throws(() => parseDevelopmentState(v, session));
  const tooMany = raw(); tooMany.tasks = Array.from({ length: 51 }, () => raw().tasks[0]);
  assert.throws(() => parseDevelopmentState(tooMany, session));
});
test('unknown task intake is never automatically retried and GET evidence reconciles the exact client request', async () => {
  let posts = 0; const submission = new Submission('A fixture task', 'client-a');
  await submission.send(async () => { posts++; throw new Error('unknown-after-send'); });
  assert.equal(submission.state, 'unknown');
  await assert.rejects(submission.send(async () => { posts++; return new Response('{}'); }));
  assert.equal(posts, 1);
  const v = raw(); v.tasks[0].goal = 'Different task'; submission.reconcile(parseDevelopmentState(v, session));
  assert.equal(submission.state, 'unknown');
  submission.reconcile(parseDevelopmentState(raw(), session)); assert.equal(submission.state, 'saved'); assert.equal(submission.taskId, 'task-a');
});
test('a reload retains an unknown intake key and another session cannot adopt it', async () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; rememberSubmission(storage, session.scopeKey, new Submission('Fixture work', id));
  const restored = restoreSubmission(storage, session.scopeKey)!;
  assert.equal(restored.state, 'unknown'); assert.equal(restored.clientRequestId, id);
  await assert.rejects(restored.send(async () => new Response('{}')));
  assert.equal(restoreSubmission(storage, 'other-session'), null); assert.equal(values.size, 0);
  rememberSubmission(storage, session.scopeKey, new Submission('Fixture work', id)); forgetSubmission(storage); assert.equal(values.size, 0);
});
test('refused intake and unreadable success body stay distinct without retry', async () => {
  const refused = new Submission('fixture', 'id'); await refused.send(async () => new Response('{}', { status: 409 }));
  assert.equal(refused.state, 'refused');
  const unknown = new Submission('fixture', 'id'); await unknown.send(async () => new Response('{'));
  assert.equal(unknown.state, 'unknown');
});
test('bounded response parsing cancels an oversized stream', async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new Uint8Array(17)); }, cancel() { cancelled = true; } });
  await assert.rejects(boundedJson(new Response(stream), 16)); assert.equal(cancelled, true);
  assert.deepEqual(await boundedJson(new Response('{"ok":true}')), { ok: true });
});
test('same-host transport captures CSRF and scope, preserves abort and exposes no bearer', async () => {
  const previous = globalThis.fetch; const calls: Array<{ path: string; init: RequestInit }> = []; const lifetime = new AbortController(); let expired = 0;
  globalThis.fetch = async (path, init) => { calls.push({ path: String(path), init: init! }); return new Response('{}', { status: calls.length === 2 ? 401 : 200 }); };
  try {
    const mutable = { ...session }; const request = sessionRequest(mutable, lifetime.signal, () => { expired++; });
    const transport = voiceTransport(mutable, request); mutable.csrfToken = 'replaced'; mutable.scopeKey = 'replaced';
    await transport.request('native-reset', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    assert.equal(transport.scopeKey, 'fixture-scope'); assert.equal(calls[0].path, '/api/avatar/remote/native-reset');
    const headers = new Headers(calls[0].init.headers);
    assert.equal(headers.get('x-o-csrf'), 'fixture-csrf'); assert.equal(headers.has('authorization'), false);
    assert.equal(calls[0].init.credentials, 'same-origin'); assert.equal(calls[0].init.body, '{}');
    await request('/api/development/status'); assert.equal(expired, 1);
    lifetime.abort(); assert.equal(calls[0].init.signal?.aborted, true);
  } finally { globalThis.fetch = previous; }
});
