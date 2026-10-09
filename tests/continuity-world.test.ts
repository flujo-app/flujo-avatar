import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSession, parseDevelopmentState, acceptObservation, taskCaption, Submission,
  rememberSubmission, restoreSubmission } from '../src/continuity/protocol';
import { browserSession, SessionExpired, readState } from '../src/continuity/api';
import { parseDevelopmentState as legacyParser, rememberSubmission as rememberLegacy } from '../src/development/protocol';

const ns = 'o-dev-continuity-fixture';
const session = { version: 1 as const, namespace: ns, workspace: ns, scopeKey: 'fixture-scope-v6', csrfToken: 'fixture-csrf', voiceAvailable: false };
const raw = () => ({ version: 2, scope: 'o-development-v1', namespace: ns, workspace: ns, originalStateAdopted: false,
  reviewMode: 'codex-sibling-continuity-v1', reviewEvidence: 'same-provider-sibling-job', revision: 4,
  admission: 'open', enabled: true, executionMode: 'tools-disabled-text-qualification', lastHeartbeat: 1000,
  workers: [{ id: 'codex-a', role: 'developer', providerId: 'codex', ready: true, observedAt: 1000 },
    { id: 'codex-b', role: 'reviewer', providerId: 'codex', ready: true, observedAt: 1000 }],
  tasks: [{ id: 'task-a', client_key: 'client-a', goal: 'Fixture text work', state: 'accepted', created_at: 1000, runs: [
    { id: 'run-a', role: 'developer', worker_id: 'codex-a', state: 'succeeded', code: null, entered_at: 1000, observed_at: 2000,
      output: 'Fixture recorded text only', evidenceSha256: 'a'.repeat(64), httpPostEntered: true, attempt: 1 },
    { id: 'run-b', role: 'reviewer', worker_id: 'codex-b', state: 'succeeded', code: null, entered_at: 2000, observed_at: 3000,
      output: 'Fixture sibling review only', evidenceSha256: 'b'.repeat(64), httpPostEntered: true, attempt: 1 }] }] });

test('wire2 keeps explicit Codex sibling markers and positively projects public fields', () => {
  const v = raw(); (v.workers[0] as unknown as Record<string, unknown>).privateToken = 'fixture-private';
  const state = parseDevelopmentState(v, parseSession(session));
  assert.equal(state.version, 2); assert.equal(state.reviewMode, 'codex-sibling-continuity-v1');
  assert.equal(state.reviewEvidence, 'same-provider-sibling-job'); assert.deepEqual(state.workers.map(w => w.providerId), ['codex', 'codex']);
  assert.equal(taskCaption(state.tasks[0]), 'Text sibling review accepted');
  assert.equal(JSON.stringify(state).includes('privateToken'), false);
});
test('legacy wire, missing/changed review metadata and any non-Codex worker refuse before presentation', () => {
  const cases = [
    { ...raw(), version: 1 }, { ...raw(), reviewMode: undefined }, { ...raw(), reviewMode: 'codex-claude-v1' },
    { ...raw(), reviewEvidence: undefined }, { ...raw(), reviewEvidence: 'independent-account' },
  ];
  for (const v of cases) assert.throws(() => parseDevelopmentState(v, session));
  for (const providerId of [undefined, 'claude-code', 'codex-subscription', null]) {
    const v = raw(); (v.workers[1] as unknown as Record<string, unknown>).providerId = providerId;
    assert.throws(() => parseDevelopmentState(v, session));
  }
  assert.throws(() => legacyParser(raw(), session));
});
test('only the fresh namespace and identical workspace are admitted', () => {
  for (const namespace of ['o-dev-swarm-20261003', 'o-dev-continuity-', 'o-dev-continuity-UPPER', 'o-dev-continuity-' + 'a'.repeat(101)]) {
    assert.throws(() => parseSession({ ...session, namespace, workspace: namespace }));
    assert.throws(() => parseDevelopmentState({ ...raw(), namespace, workspace: namespace }, { namespace, workspace: namespace }));
  }
  assert.throws(() => parseSession({ ...session, workspace: 'different' }));
  assert.throws(() => parseDevelopmentState({ ...raw(), namespace: 'o-dev-continuity-other', workspace: 'o-dev-continuity-other' }, session));
  assert.throws(() => parseDevelopmentState({ ...raw(), originalStateAdopted: true }, session));
});
test('distinct workers, roles and run UUIDs remain required; coding mode cannot masquerade as text qualification', () => {
  const duplicateWorker = raw(); duplicateWorker.workers[1].id = duplicateWorker.workers[0].id;
  const duplicateRole = raw(); duplicateRole.workers[1].role = 'developer';
  const duplicateRun = raw(); duplicateRun.tasks[0].runs[1].id = duplicateRun.tasks[0].runs[0].id;
  for (const v of [duplicateWorker, duplicateRole, duplicateRun, { ...raw(), executionMode: 'coding' }]) assert.throws(() => parseDevelopmentState(v, session));
});
test('equal revisions update reported readiness while older observations never replace current state', () => {
  const first = parseDevelopmentState(raw(), session), v = raw(); v.workers[1].ready = false; v.lastHeartbeat = 4000;
  const next = parseDevelopmentState(v, session); assert.equal(acceptObservation(first, next), next);
  assert.equal(acceptObservation(next, { ...first, revision: 3 }), next);
});
test('unknown intake reconciles genuine sibling snapshot without a second POST', async () => {
  let posts = 0; const submission = new Submission('Fixture text work', 'client-a');
  await submission.send(async () => { posts++; throw new Error('fixture-unknown'); });
  assert.equal(submission.state, 'unknown'); submission.reconcile(parseDevelopmentState(raw(), session));
  assert.equal(submission.state, 'saved'); assert.equal(posts, 1);
  await assert.rejects(submission.send(async () => { posts++; return new Response('{}'); })); assert.equal(posts, 1);
});
test('original and continuity pending journals are separate and changed sessions refuse prior scope', () => {
  const values = new Map<string, string>(); const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  rememberLegacy(storage, session.scopeKey, new Submission('Original fixture text', id));
  assert.equal(restoreSubmission(storage, session.scopeKey), null);
  rememberSubmission(storage, session.scopeKey, new Submission('Continuity fixture text', id));
  assert.equal(restoreSubmission(storage, session.scopeKey)?.goal, 'Continuity fixture text');
  assert.equal(restoreSubmission(storage, 'other-scope'), null); assert.equal(values.size, 1);
});
test('a changed or malformed session revokes current identity, and status parsing still demands wire2', async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ ...session, namespace: 'old-swarm', workspace: 'old-swarm' }));
    await assert.rejects(browserSession(new AbortController().signal), SessionExpired);
    globalThis.fetch = async () => new Response('{'); await assert.rejects(browserSession(new AbortController().signal), SessionExpired);
    globalThis.fetch = async () => new Response(JSON.stringify(session)); assert.deepEqual(await browserSession(new AbortController().signal), session);
    await assert.rejects(readState(new Response(JSON.stringify({ ...raw(), version: 1 })), session));
    assert.equal((await readState(new Response(JSON.stringify(raw())), session)).version, 2);
  } finally { globalThis.fetch = previous; }
});
