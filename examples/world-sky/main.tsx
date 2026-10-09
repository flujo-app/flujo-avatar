import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { WorldSky, currentWorldSkySelection, type WorldSkyIntent, type WorldSkyModel, type WorldSkySelection } from '@flujo-ai/avatar/world-sky';
import '@flujo-ai/avatar/styles.css';
import './fixture.css';

const fixture: WorldSkyModel = { schemaVersion: 1, scope: 'operator-source-registry', commands: false,
  sample: true, observedAt: '2026-10-03T00:00:00Z', sources: ['a', 'b'].map(id => ({
    id: `source-${id}`, label: `Fixture ${id.toUpperCase()}`, factoryId: `factory-${id}`, status: 'observed',
    snapshot: { snapshot: { cells: [{ id: 'same-cell' }], tasks: [], effects: [] } },
  })) };

function Example() {
  const [model, setModel] = useState<WorldSkyModel | null>(fixture);
  const [selection, setSelection] = useState<WorldSkySelection | null>({ sourceId: 'source-a', factoryId: 'factory-a', kind: 'cell', id: 'same-cell' });
  const [intent, setIntent] = useState<WorldSkyIntent | null>(null);
  return <WorldSky model={model} selection={selection} onNavigate={next => {
    // A real host validates against its canonical DTO before applying navigation.
    setIntent(next); setSelection(currentWorldSkySelection(model, next.selection));
  }} world={<iframe className="world-fixture" title="Existing FLUJO World fixture" src="http://127.0.0.1:43948/world" />}
  sky={<div className="sky-fixture">
    <p className="sample-label">Sample data · presentation fixture · no live cloud, voice or commands</p>
    <div className="sky-intro"><h1>Above the little world.</h1><p>{model ? `${model.sources.length} recorded fixture sources. Scroll down to return.` : 'No current swarm observations. The World remains available.'}</p></div>
    <div className="constellation">{model?.sources.map(source => <button key={source.id} className="source-star"
      aria-label={`Inspect ${source.label} / same-cell`} aria-pressed={selection?.sourceId === source.id && selection.factoryId === source.factoryId}
      onClick={() => setSelection({ sourceId: source.id, factoryId: source.factoryId, kind: 'cell', id: 'same-cell' })}>
      <span className="star" aria-hidden="true" /><strong>{source.label}</strong><small>{source.factoryId} · same-cell</small>
    </button>)}</div>
    <div className="fixture-controls">
      <button onClick={() => { setIntent(null); setModel(current => current && ({ ...current, sources: current.sources.map(source => ({ ...source, factoryId: 'replacement-factory' })) })); }}>Replace fixture authority</button>
      <button onClick={() => { setModel(null); setSelection(null); setIntent(null); }}>Clear sky observations</button>
      <button onClick={() => { setModel(fixture); setSelection(null); }}>Reset fixture</button>
      <output aria-label="Last presentation intent">{intent ? JSON.stringify(intent) : 'No navigation intent yet'}</output>
    </div>
  </div>} />;
}
createRoot(document.getElementById('root')!).render(<Example />);
