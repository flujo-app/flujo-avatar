import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WorldSky, currentWorldSkySelection, type WorldSkyModel, type WorldSkySelection } from '@flujo-ai/avatar/world-sky';

const model: WorldSkyModel = { schemaVersion: 1, scope: 'operator-source-registry', commands: false,
  sample: true, observedAt: '2026-10-03T00:00:00Z', sources: [
    { id: 'source-a', label: 'Fixture A', factoryId: 'factory-a', status: 'observed', snapshot: { snapshot: { cells: [{ id: 'same-cell' }], tasks: [{ id: 'task' }], effects: [{ key: 'effect' }] } } },
    { id: 'source-b', label: 'Fixture B', factoryId: 'factory-b', status: 'observed', snapshot: { snapshot: { cells: [{ id: 'same-cell' }], tasks: [], effects: [] } } },
  ] };
const cell: WorldSkySelection = { sourceId: 'source-a', factoryId: 'factory-a', kind: 'cell', id: 'same-cell' };

test('selection retains the full source/factory/record tuple and drops extra fields', () => {
  assert.deepEqual(currentWorldSkySelection(model, { ...cell, credential: 'fixture-private' } as WorldSkySelection), cell);
  assert.equal(currentWorldSkySelection(model, { ...cell, sourceId: 'source-b' }), null);
  assert.equal(currentWorldSkySelection(model, { ...cell, factoryId: 'factory-b' }), null);
});

test('a changed authority or removed record cannot revive an old selection', () => {
  const changed: WorldSkyModel = { ...model, sources: model.sources.map(source => ({ ...source, factoryId: 'new-factory' })) };
  assert.equal(currentWorldSkySelection(changed, cell), null);
  assert.equal(currentWorldSkySelection({ ...model, sources: model.sources.slice(1) }, cell), null);
  assert.equal(currentWorldSkySelection(model, { ...cell, id: 'removed-cell' }), null);
});

test('unavailable observations clear selection; retained stale records stay inspectable', () => {
  assert.equal(currentWorldSkySelection(null, cell), null);
  for (const status of ['stale', 'unavailable'] as const) {
    const next = { ...model, sources: model.sources.map(source => ({ ...source, status })) };
    assert.deepEqual(currentWorldSkySelection(next, cell), status === 'stale' ? cell : null);
  }
});

test('source, task and effect selection require their own record membership', () => {
  for (const [kind, id] of [['source', 'source-a'], ['task', 'task'], ['effect', 'effect']] as const) {
    const selection = { ...cell, kind, id };
    assert.deepEqual(currentWorldSkySelection(model, selection), selection);
    assert.equal(currentWorldSkySelection(model, { ...selection, id: 'other-record' }), null);
  }
});

test('server rendering is passive, labels fixtures and contains both host surfaces', () => {
  const html = renderToStaticMarkup(createElement(WorldSky, { model, selection: cell,
    world: createElement('p', null, 'Existing world surface'), sky: createElement('p', null, 'Existing swarm surface'),
    onNavigate: () => { throw Error('Rendering cannot navigate or dispatch'); } }));
  assert.match(html, /Sample data · sky preview/);
  assert.match(html, /Existing world surface/); assert.match(html, /Existing swarm surface/);
  assert.doesNotMatch(html, /https:|bearer|fixture-private/i);
});
