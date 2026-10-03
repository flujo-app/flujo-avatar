import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FactoryAvatar, type FactoryAvatarObservation, type AvatarLocale } from '@flujo-ai/avatar/factory';
import * as factoryExports from '@flujo-ai/avatar/factory';
const snapshot: FactoryAvatarObservation = {
  factoryId: 'fixture', revision: 7, cursor: 'opaque', observedAt: '2026-10-02T12:00:00Z', readState: 'fresh', mission: 'Inspect recorded work',
  selectedCell: { id: 'cell', purpose: 'Inspect', heartbeat: '2026-10-02T11:59:45Z', reportedStatus: 'ready', activityEvidence: 'recent' },
  selectedTask: { id: 'task', owner: 'cell', attempt: 1, reportedStatus: 'running', candidateDigest: 'a'.repeat(64), reviewEvidenceDigest: null },
  effectsDrained: true, unresolvedEffects: 0, workerQuiescence: 'unverified', commands: false, voice: false,
};
const render = (observation: FactoryAvatarObservation | null, locale: AvatarLocale = 'en') => renderToStaticMarkup(createElement(FactoryAvatar, { observation, locale, avatar: 'moss', onInspect: () => { throw new Error('Rendering must not dispatch inspection'); } }));
test('a fresh observation and recorded running task do not claim current worker activity', () => {
  const html = render(snapshot);
  assert.match(html, /data-phase="idle"/);
  assert.match(html, /Recorded task task: running/);
  assert.match(html, /Current worker state is unverified/);
  assert.match(html, /Read-only · voice and execution unavailable/);
});
test('equal-revision observations replace heartbeat presentation', () => {
  const next = { ...snapshot, selectedCell: { ...snapshot.selectedCell!, heartbeat: '2026-10-02T12:01:45Z' } };
  assert.match(render(next), /datetime="2026-10-02T12:01:45Z"/i);
  assert.doesNotMatch(render(next), /datetime="2026-10-02T11:59:45Z"/i);
  assert.equal(next.revision, snapshot.revision);
});
test('unavailable state hides old evidence and stale state remains identified', () => {
  assert.match(render({ ...snapshot, readState: 'stale' }), /Last observation · connection stale/);
  const unavailable = render({ ...snapshot, readState: 'unavailable' });
  assert.match(unavailable, /No current observation/);
  assert.doesNotMatch(unavailable, /a{64}|Recorded task/);
  assert.match(render(null), /data-phase="error"/);
});
test('preview labeling and canonical captions exist in all three locales', () => {
  const expected = { en: ['Sample data', 'Recorded task'], es: ['Datos de ejemplo', 'Tarea registrada'], pt: ['Dados de exemplo', 'Tarefa registrada'] };
  for (const locale of ['en', 'es', 'pt'] as const) {
    const html = render({ ...snapshot, readState: 'preview' }, locale);
    for (const text of expected[locale]) assert.ok(html.includes(text));
    assert.match(html, /task/);
  }
});

test('the compiled Factory boundary still exports only presentation components', () => {
  assert.deepEqual(Object.keys(factoryExports).sort(), ['Eyes', 'FactoryAvatar']);
});

const terminalCopy = {
  en: { completed: 'operation completed', cancelled: 'cancelled', completion: 'Software review and delivery are not established by this status.', cancellation: 'Work was abandoned or acceptance was unmet.', worker: 'Current worker state is unverified.', preview: 'Sample data' },
  es: { completed: 'operación completada', cancelled: 'cancelada', completion: 'Este estado no acredita la revisión ni la entrega de software.', cancellation: 'El trabajo se abandonó o no cumplió los criterios de aceptación.', worker: 'El estado actual de los trabajadores no está verificado.', preview: 'Datos de ejemplo' },
  pt: { completed: 'operação concluída', cancelled: 'cancelada', completion: 'Este estado não comprova a revisão nem a entrega de software.', cancellation: 'O trabalho foi abandonado ou não atendeu aos critérios de aceitação.', worker: 'O estado atual dos trabalhadores não está verificado.', preview: 'Dados de exemplo' },
};

for (const reportedStatus of ['completed', 'cancelled'] as const) {
  test(`${reportedStatus} describes a terminal outcome in EN/ES/PT without claiming delivery or worker activity`, () => {
    for (const locale of ['en', 'es', 'pt'] as const) {
      const c = terminalCopy[locale];
      for (const readState of ['fresh', 'stale', 'preview'] as const) {
        for (const activityEvidence of ['idle', 'recent', 'uncertain'] as const) {
          const observation: FactoryAvatarObservation = {
            ...snapshot, readState,
            selectedCell: { ...snapshot.selectedCell!, activityEvidence },
            selectedTask: { ...snapshot.selectedTask!, reportedStatus, reviewEvidenceDigest: 'b'.repeat(64) },
          };
          const html = render(observation, locale);
          const caption = html.match(/<p[^>]*role="status"[^>]*>(.*?)<\/p>/)?.[1];
          assert.ok(caption?.includes(c[reportedStatus]), `${locale}/${readState}/${activityEvidence}: terminal caption`);
          assert.ok(caption?.includes(reportedStatus === 'completed' ? c.completion : c.cancellation));
          assert.ok(html.includes(c.worker));
          assert.match(html, /data-phase="idle"/);
          assert.doesNotMatch(html, /data-phase="(?:thinking|usingApp|speaking)"/);
          assert.doesNotMatch(caption!, /: (?:running|verified|delivered|en ejecución|verificada|entregada|em execução|entregue)\./);
          assert.match(html, /<code>a{64}<\/code>/);
          assert.match(html, /<code>b{64}<\/code>/);
          if (readState === 'preview') assert.ok(html.includes(c.preview));
          assert.equal(observation.commands, false);
          assert.equal(observation.voice, false);
          assert.equal(observation.workerQuiescence, 'unverified');
        }
      }
    }
  });

  test(`${reportedStatus} evidence disappears when the host marks the observation unavailable`, () => {
    for (const locale of ['en', 'es', 'pt'] as const) {
      const html = render({ ...snapshot, readState: 'unavailable', selectedTask: { ...snapshot.selectedTask!, reportedStatus, reviewEvidenceDigest: 'b'.repeat(64) } }, locale);
      assert.match(html, /data-phase="error"/);
      assert.doesNotMatch(html, /<code>|a{64}|b{64}|task:/);
      assert.ok(!html.includes(terminalCopy[locale][reportedStatus]));
    }
  });
}

test('cancellation retains existing attempt, owner and evidence without mutating the host observation', () => {
  const selectedTask = Object.freeze({ ...snapshot.selectedTask!, reportedStatus: 'cancelled' as const, attempt: 3, reviewEvidenceDigest: 'b'.repeat(64) });
  const observation = Object.freeze({ ...snapshot, selectedTask });
  const before = structuredClone(observation);
  const html = render(observation);
  assert.match(html, /Recorded task task: cancelled\. Attempt 3\./);
  assert.match(html, /<code>a{64}<\/code>/);
  assert.match(html, /<code>b{64}<\/code>/);
  assert.deepEqual(observation, before);
});

test('terminal outcomes allow absent evidence without inventing candidate or review hashes', () => {
  for (const reportedStatus of ['completed', 'cancelled'] as const) {
    const html = render({ ...snapshot, selectedTask: { ...snapshot.selectedTask!, reportedStatus, candidateDigest: null, reviewEvidenceDigest: null } });
    assert.doesNotMatch(html, /<code>|Candidate evidence|Review evidence/);
    assert.match(html, /Current worker state is unverified/);
  }
});
