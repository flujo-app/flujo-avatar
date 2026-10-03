/** Positive projection of the coordinator's public wire. No private worker bindings. */
export interface BrowserSession {
  version: 1; namespace: string; workspace: string; scopeKey: string;
  csrfToken: string; voiceAvailable: boolean;
}
export type RunState = 'queued' | 'entered' | 'unknown' | 'active' | 'succeeded' | 'error';
export interface WorkRun {
  id: string; role: 'developer' | 'reviewer'; workerId: string; state: RunState;
  code: string | null; enteredAt: number | null; observedAt: number | null;
  output: string | null; evidenceSha256: string | null; httpPostEntered: boolean; attempt: 1;
}
export interface WorkTask { id: string; clientKey: string; goal: string; state: string; createdAt: number; runs: WorkRun[] }
export interface DevelopmentState {
  version: 1; namespace: string; workspace: string; revision: number;
  admission: 'open' | 'closed'; enabled: boolean; lastHeartbeat: number | null;
  executionMode: 'tools-disabled-text-qualification';
  workers: Array<{ id: string; role: 'developer' | 'reviewer'; ready: boolean; observedAt: number | null }>;
  tasks: WorkTask[];
}
const fail = (): never => { throw new Error('public_state_refused'); };
const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : fail();
const text = (v: unknown, max = 256): string => typeof v === 'string' && v.length > 0 && v.length <= max ? v : fail();
const integer = (v: unknown): number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : fail();
const time = (v: unknown): number | null => v === null ? null : integer(v);
const bool = (v: unknown): boolean => typeof v === 'boolean' ? v : fail();
const choice = <T extends string>(v: unknown, values: readonly T[]): T => values.includes(v as T) ? v as T : fail();
const list = (v: unknown, max: number): unknown[] => Array.isArray(v) && v.length <= max ? v : fail();
const nullableText = (v: unknown, max = 256): string | null => v === null ? null : text(v, max);
const role = (v: unknown) => choice(v, ['developer', 'reviewer'] as const);
const unique = <T extends { id: string }>(values: T[]): T[] => { if (new Set(values.map(v => v.id)).size !== values.length) fail(); return values; };

export function parseSession(value: unknown): BrowserSession {
  const v = record(value); if (v.version !== 1) fail();
  return { version: 1, namespace: text(v.namespace), workspace: text(v.workspace), scopeKey: text(v.scopeKey, 512),
    csrfToken: text(v.csrfToken, 512), voiceAvailable: bool(v.voiceAvailable) };
}
export function parseDevelopmentState(value: unknown, session: Pick<BrowserSession, 'namespace' | 'workspace'>): DevelopmentState {
  const v = record(value);
  if (v.version !== 1 || v.scope !== 'o-development-v1' || v.originalStateAdopted !== false
    || v.namespace !== session.namespace || v.workspace !== session.workspace) fail();
  const workers = unique(list(v.workers, 32).map(item => { const w = record(item); return {
    id: text(w.id), role: role(w.role), ready: bool(w.ready), observedAt: time(w.observedAt),
  }; }));
  if (workers.length !== 2 || new Set(workers.map(w => w.role)).size !== 2) fail();
  const tasks = unique(list(v.tasks, 50).map(item => {
    const t = record(item);
    const runs = unique(list(t.runs, 2).map(item => {
      const r = record(item), evidence = nullableText(r.evidenceSha256, 64);
      if (evidence !== null && !/^[a-f0-9]{64}$/.test(evidence)) fail();
      if (r.attempt !== 1) fail();
      if (!workers.some(w => w.id === r.worker_id && w.role === r.role) || bool(r.httpPostEntered) !== (r.entered_at !== null)) fail();
      return { id: text(r.id), role: role(r.role), workerId: text(r.worker_id),
        state: choice(r.state, ['queued', 'entered', 'unknown', 'active', 'succeeded', 'error'] as const),
        code: nullableText(r.code), enteredAt: time(r.entered_at), observedAt: time(r.observed_at),
        output: nullableText(r.output, 65536), evidenceSha256: evidence,
        httpPostEntered: bool(r.httpPostEntered), attempt: 1 as const };
    }));
    if (new Set(runs.map(r => r.role)).size !== runs.length) fail();
    return { id: text(t.id), clientKey: text(t.client_key), goal: text(t.goal, 6144),
      state: choice(t.state, ['developing', 'reviewing', 'accepted', 'changes_requested', 'held_error', 'held_invalid_review'] as const),
      createdAt: integer(t.created_at), runs };
  }));
  return { version: 1, namespace: session.namespace, workspace: session.workspace, revision: integer(v.revision),
    admission: choice(v.admission, ['open', 'closed'] as const), enabled: bool(v.enabled), lastHeartbeat: time(v.lastHeartbeat),
    executionMode: choice(v.executionMode, ['tools-disabled-text-qualification'] as const), workers, tasks };
}

const pendingKey = 'flujo-avatar:development-pending';
export function rememberSubmission(storage: Pick<Storage, 'setItem'>, scope: string, submission: Submission): void {
  storage.setItem(pendingKey, JSON.stringify({ scope, clientRequestId: submission.clientRequestId, goal: submission.goal }));
}
export function forgetSubmission(storage: Pick<Storage, 'removeItem'>): void { storage.removeItem(pendingKey); }
export function restoreSubmission(storage: Pick<Storage, 'getItem' | 'removeItem'>, scope: string): Submission | null {
  const raw = storage.getItem(pendingKey); if (!raw) return null;
  const v = record(JSON.parse(raw));
  if (v.scope !== scope) { storage.removeItem(pendingKey); return null; }
  const id = text(v.clientRequestId, 36); if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)) fail();
  const submission = new Submission(text(v.goal, 1500), id); submission.state = 'unknown'; return submission;
}

export function acceptObservation(previous: DevelopmentState | null, next: DevelopmentState): DevelopmentState {
  if (previous && (previous.namespace !== next.namespace || previous.workspace !== next.workspace || next.revision < previous.revision)) return previous;
  // Equal revisions can carry newer readiness and heartbeat observations.
  return next;
}
export const taskCaption = (task: WorkTask): string => ({ developing: 'Development queued', reviewing: 'Review queued',
  accepted: 'Review accepted', changes_requested: 'Changes requested', held_error: 'Work held', held_invalid_review: 'Review held' })[task.state] ?? 'Recorded state';
export const runCaption = (run: WorkRun): string => ({ queued: 'Queued', entered: 'Submission entered; result pending', unknown: 'Outcome unconfirmed',
  active: 'Worker reports active', succeeded: 'Recorded result', error: 'Recorded error' })[run.state];

/** One explicit submission; an unknown response is reconciled by GET, never POST retry. */
export class Submission {
  state: 'idle' | 'sending' | 'unknown' | 'saved' | 'refused' = 'idle';
  readonly clientRequestId: string;
  taskId: string | null = null;
  constructor(readonly goal: string, id: string) { this.clientRequestId = id; }
  async send(request: (body: { clientRequestId: string; goal: string }) => Promise<Response>): Promise<void> {
    if (this.state !== 'idle') throw new Error('submission_already_entered');
    this.state = 'sending';
    try {
      const response = await request({ clientRequestId: this.clientRequestId, goal: this.goal });
      if (!response.ok) { await response.body?.cancel(); this.state = 'refused'; return; }
      const v = record(await response.json()); this.taskId = text(v.id); bool(v.duplicate); this.state = 'saved';
    } catch { this.state = 'unknown'; }
  }
  reconcile(snapshot: DevelopmentState): void {
    if (this.state !== 'unknown') return;
    const saved = snapshot.tasks.find(t => t.clientKey === this.clientRequestId && t.goal === this.goal);
    if (saved) { this.taskId = saved.id; this.state = 'saved'; }
  }
}
