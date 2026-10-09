import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FactoryAvatar, type FactoryAvatarObservation, type AvatarLocale } from '@o/world-presentation';
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
