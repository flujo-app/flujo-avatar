export type WorldSkyLayer = 'world' | 'sky';
export interface WorldSkySelection {
  sourceId: string;
  factoryId: string;
  kind: 'source' | 'cell' | 'task' | 'effect';
  id: string;
}

/** Structural view of the host-validated Brain swarm model, not a DTO parser. */
export interface WorldSkyModel {
  schemaVersion: 1;
  scope: 'operator-source-registry';
  commands: false;
  sample: boolean;
  observedAt: string;
  sources: ReadonlyArray<{
    id: string;
    label: string;
    factoryId: string;
    status: 'observed' | 'stale' | 'unavailable';
    snapshot: {
      snapshot: {
        cells: ReadonlyArray<{ id: string }>;
        tasks: ReadonlyArray<{ id: string }>;
        effects: ReadonlyArray<{ key: string }>;
      };
    } | null;
  }>;
}

export interface WorldSkyIntent {
  layer: WorldSkyLayer;
  selection: WorldSkySelection | null;
}

/** A presentation intent cannot revive a selection removed by the host. */
export function currentWorldSkySelection(model: WorldSkyModel | null, selection: WorldSkySelection | null): WorldSkySelection | null {
  if (!model || !selection) return null;
  const source = model.sources.find(row => row.id === selection.sourceId && row.factoryId === selection.factoryId);
  if (!source || source.status === 'unavailable') return null;
  const records = source.snapshot?.snapshot;
  const present = selection.kind === 'source' ? selection.id === source.id
    : selection.kind === 'cell' ? records?.cells.some(row => row.id === selection.id)
    : selection.kind === 'task' ? records?.tasks.some(row => row.id === selection.id)
    : selection.kind === 'effect' && records?.effects.some(row => row.key === selection.id);
  return present ? { sourceId: source.id, factoryId: source.factoryId, kind: selection.kind, id: selection.id } : null;
}
