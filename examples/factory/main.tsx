import { useState, version } from 'react';
import { createRoot } from 'react-dom/client';
import { FactoryAvatar, type FactoryAvatarObservation, type AvatarLocale } from '@o/world-presentation';
import '@o/world-presentation/styles.css';
import './example.css';
const fixture: FactoryAvatarObservation = {
  factoryId: 'design-fixture', revision: 7, cursor: 'opaque-example', observedAt: '2026-10-02T12:00:00Z', readState: 'preview',
  mission: 'Inspect the world through its white eyes',
  selectedCell: { id: 'developer-1', purpose: 'A sample delegated cell', heartbeat: '2026-10-02T11:59:45Z', reportedStatus: 'ready', activityEvidence: 'recent' },
  selectedTask: { id: 'sample-task', attempt: 1, owner: 'developer-1', reportedStatus: 'review', candidateDigest: 'a'.repeat(64), reviewEvidenceDigest: null },
  unresolvedEffects: 1, effectsDrained: false, workerQuiescence: 'unverified', commands: false, voice: false,
};
function Example() {
  const [observation, setObservation] = useState(fixture), [locale, setLocale] = useState<AvatarLocale>('en'), [selection, setSelection] = useState('None');
  return <main><header><p className="preview-notice">Interactive sample data · React {version} consumer · no backend or voice connection</p><h1>Read the world. Inspect its evidence.</h1></header><div className="controls"><label>Language <select value={locale} onChange={event => setLocale(event.target.value as AvatarLocale)}><option value="en">EN</option><option value="es">ES</option><option value="pt">PT</option></select></label>{(['preview', 'fresh', 'stale', 'unavailable'] as const).map(state => <button key={state} onClick={() => setObservation(current => ({ ...current, readState: state }))}>{state}</button>)}<button onClick={() => setObservation(current => ({ ...current, selectedCell: { ...current.selectedCell!, heartbeat: new Date(Date.parse(current.selectedCell!.heartbeat) + 60000).toISOString() } }))}>Advance equal-revision heartbeat</button></div><FactoryAvatar observation={observation} locale={locale} avatar="moss" onInspect={target => setSelection(`${target.kind}: ${target.id}`)} /><p role="status">Inspected: {selection}</p></main>;
}
createRoot(document.getElementById('root')!).render(<Example />);
