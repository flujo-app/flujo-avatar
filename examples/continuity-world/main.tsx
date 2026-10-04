import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import Eyes from '../../src/client/Eyes';
import { useNativeRouterVoice } from '../../src/client/useNativeRouterVoice';
import type { NativeVoiceTransport } from '../../src/client/nativeVoiceTransport';
import WorldScene from '@flujo-world/WorldScene';
import type { AvatarWorldSnapshot } from '@/shared/types/avatar';
import { acceptObservation, parseDevelopmentState, Submission, rememberSubmission, restoreSubmission, forgetSubmission, taskCaption, runCaption, type BrowserSession, type DevelopmentState } from '../../src/continuity/protocol';
import { browserSession, SessionExpired, sessionRequest, readState, voiceTransport } from '../../src/continuity/api';
import './style.css';

const lockedTransport: NativeVoiceTransport = Object.freeze({ scopeKey: 'browser-session-unavailable',
  workletUrl: '/world/avatar-audio-capture.js', request: async () => { throw new SessionExpired(); } });

function World() {
  const [session, setSession] = useState<BrowserSession | null>(null);
  const [snapshot, setSnapshot] = useState<DevelopmentState | null>(null);
  const [connection, setConnection] = useState<'loading' | 'ready' | 'stale' | 'locked' | 'unavailable'>('loading');
  const [drawer, setDrawer] = useState(false), [goal, setGoal] = useState(''), [caption, setCaption] = useState('');
  const [position, setPosition] = useState({ x: 50, y: 31 });
  const [revision, updateSubmission] = useState(0), [retry, reconnect] = useState(0);
  const pending = useRef<Submission | null>(null), state = useRef<DevelopmentState | null>(null);
  const activeScope = useRef<string | null>(null), authority = useRef<AbortController | null>(null);
  const expire = useCallback(() => {
    authority.current?.abort(); activeScope.current = null; pending.current = null; state.current = null;
    setSession(null); setSnapshot(null); setCaption(''); setConnection('locked'); updateSubmission(n => n + 1);
    try { forgetSubmission(sessionStorage); } catch { /* Expired UI is already closed. */ }
  }, []);
  useEffect(() => {
    const controller = new AbortController(); setConnection('loading');
    void browserSession(controller.signal).then(value => {
      if (controller.signal.aborted) return;
      pending.current = restoreSubmission(sessionStorage, value.scopeKey);
      if (pending.current) setCaption('Checking your unconfirmed submission.');
      activeScope.current = value.scopeKey; setSession(value);
    }).catch(error => { if (!controller.signal.aborted) {
      setConnection(error instanceof SessionExpired ? 'locked' : 'unavailable');
      if (error instanceof SessionExpired) window.location.replace('/');
    } });
    return () => controller.abort();
  }, [retry]);
  const binding = useMemo(() => {
    if (!session) return null;
    const controller = new AbortController();
    return { controller, request: sessionRequest(session, controller.signal, expire) };
  }, [session, expire]);
  const request = binding?.request ?? null;
  const transport = useMemo(() => session && request ? voiceTransport(session, request) : lockedTransport, [session, request]);
  useEffect(() => {
    if (!session || !binding || !request) return;
    const controller = binding.controller; authority.current = controller; const scope = session.scopeKey;
    let stream: EventSource | null = null, timer: ReturnType<typeof setTimeout> | undefined;
    const current = () => !controller.signal.aborted && activeScope.current === scope;
    const receive = (value: DevelopmentState) => {
      if (!current()) return;
      const next = acceptObservation(state.current, value); state.current = next; setSnapshot(next); setConnection('ready');
      const wasUnknown = pending.current?.state === 'unknown'; pending.current?.reconcile(next);
      if (wasUnknown && pending.current?.state === 'saved') {
        forgetSubmission(sessionStorage); setCaption('Task saved.'); setGoal('');
      }
      updateSubmission(n => n + 1);
    };
    const open = () => {
      if (!current()) return; stream?.close(); stream = new EventSource('/api/development/events');
      stream.addEventListener('state', event => {
        if (!current()) return;
        try {
          const data = (event as MessageEvent<string>).data;
          if (data.length > 2 * 1024 * 1024) throw new Error('event_limit');
          receive(parseDevelopmentState(JSON.parse(data), session));
        } catch { stream?.close(); setConnection('stale'); }
      });
      stream.onerror = () => { stream?.close(); if (current()) setConnection('stale'); };
    };
    const check = async () => {
      try {
        const fresh = await browserSession(controller.signal); if (!current()) return;
        if (fresh.scopeKey !== scope || fresh.namespace !== session.namespace || fresh.workspace !== session.workspace
          || fresh.csrfToken !== session.csrfToken) { expire(); return; }
        if (fresh.voiceAvailable !== session.voiceAvailable) { setSession(fresh); return; }
        receive(await readState(await request('/api/development/status'), session));
        if (!stream || stream.readyState === EventSource.CLOSED) open();
      } catch (error) {
        if (!current()) return;
        if (error instanceof SessionExpired) { expire(); return; }
        setConnection('stale');
      } finally { if (current()) timer = setTimeout(check, 15000); }
    };
    void check();
    return () => { controller.abort(); stream?.close(); if (timer) clearTimeout(timer); };
  }, [session, binding, request, expire]);

  const submit = useCallback(async (text: string) => {
    const value = text.trim(), live = state.current;
    if (!value || value.length > 1500 || connection !== 'ready' || !request || !live || live.admission !== 'open' || !live.enabled
      || activeScope.current !== session?.scopeKey || (pending.current && ['sending', 'unknown'].includes(pending.current.state))) return;
    const ownedScope = session.scopeKey, submission = new Submission(value, crypto.randomUUID()); pending.current = submission;
    try { rememberSubmission(sessionStorage, ownedScope, submission); }
    catch { pending.current = null; setCaption('Browser storage is unavailable. The task was not sent.'); return; }
    updateSubmission(n => n + 1); setCaption('Saving your task…');
    await submission.send(body => request('/api/development/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    if (activeScope.current !== ownedScope) return;
    if (submission.state === 'saved' || submission.state === 'refused') forgetSubmission(sessionStorage);
    setCaption(submission.state === 'saved' ? 'Task saved.' : submission.state === 'unknown'
      ? 'Submission unconfirmed. Checking saved work.' : 'The task was refused. Check work status.');
    if (submission.state === 'saved') setGoal(''); updateSubmission(n => n + 1);
  }, [request, session, connection]);
  const blocked = connection !== 'ready' || !snapshot?.enabled || snapshot.admission !== 'open'
    || Boolean(pending.current && ['sending', 'unknown'].includes(pending.current.state));
  const voice = useNativeRouterVoice({ avatar: 'moss', locale: 'en', workInput: true, transport,
    observerPaused: blocked, onTranscript: (_id, role, text) => { if (role === 'assistant') setCaption(text); },
    onObservedTranscript: (_id, text) => { void submit(text); } });
  useEffect(() => { if (!session?.voiceAvailable && voice.connected) voice.disconnect(); }, [session?.voiceAvailable, voice.connected, voice.disconnect]);
  const world: AvatarWorldSnapshot | null = snapshot ? { checkedAt: snapshot.lastHeartbeat ?? 0, workModel: null,
    unavailable: [], truncated: [], objects: snapshot.tasks.flatMap(task => task.runs.filter(run => run.output !== null)
      .map(run => ({ id: run.id, name: task.goal, kind: 'artifact' as const, state: 'recorded-output', href: '#' }))) } : null;
  const availability = connection === 'locked' ? 'Sign in to continue' : connection === 'unavailable' ? 'Connection unavailable'
    : connection === 'loading' ? 'Connecting' : connection === 'stale' ? 'Snapshot stale'
    : snapshot?.admission === 'closed' ? 'New work stopped' : snapshot?.enabled ? 'Connected' : 'Dispatch held';
  const wandering = position.x !== 50 || position.y !== 31;
  return <main className="world" data-drawer={drawer}>
    <WorldScene snapshot={world} phase={voice.phase} level={voice.audioLevel} exploring={wandering} />
    <button className="terrain" type="button" aria-label="Move the eyes through the world" onClick={event => {
      const r = event.currentTarget.getBoundingClientRect();
      setPosition({ x: Math.max(16, Math.min(84, (event.clientX - r.left) / r.width * 100)), y: Math.max(20, Math.min(58, (event.clientY - r.top) / r.height * 100)) });
    }} onKeyDown={event => { if (event.key.startsWith('Arrow')) { event.preventDefault(); setPosition(p => ({ x: Math.max(16, Math.min(84, p.x + (event.key === 'ArrowRight' ? 7 : event.key === 'ArrowLeft' ? -7 : 0))), y: Math.max(20, Math.min(58, p.y + (event.key === 'ArrowDown' ? 7 : event.key === 'ArrowUp' ? -7 : 0))) })); } }} />
    <header><a href="/world" className="brand">flujo<span> / Codex continuity</span></a>
      <button aria-expanded={drawer} aria-controls="work-record" onClick={() => setDrawer(!drawer)}>Work <span aria-hidden="true">↗</span></button></header>
    <section className="companion" style={{ '--arrival-x': `${position.x}%`, '--arrival-y': `${position.y}%` } as CSSProperties}>
      <div className="presence">{voice.connected ? voice.phase === 'speaking' ? 'Speaking' : 'Listening' : availability}</div>
      <div className="character"><Eyes phase={voice.phase} avatar="moss" level={voice.audioLevel} /></div><div className="shadow" />
      {!wandering && <div className="invitation"><h1>What shall we make?</h1><p>{caption || 'A little world for your next idea.'}</p></div>}
    </section>
    <div className="bottom">
      {connection === 'locked' ? <p className="entry"><a href="/">Sign in</a><button onClick={() => reconnect(n => n + 1)}>Check session</button></p>
        : connection === 'unavailable' ? <button onClick={() => reconnect(n => n + 1)}>Reconnect</button>
        : <form onSubmit={event => { event.preventDefault(); voice.interrupt(false); void submit(goal); }}>
          <label className="sr-only" htmlFor="goal">Your next task</label>
          <textarea id="goal" placeholder="Describe your next idea…" value={goal} rows={1} maxLength={1500} disabled={blocked}
            onChange={event => setGoal(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
          <button type="submit" aria-label="Save task" disabled={blocked || !goal.trim()}>↑</button>
          {session?.voiceAvailable && <button type="button" className="voice" aria-pressed={voice.connected} aria-label={voice.connected ? 'Stop voice' : 'Start voice'}
            disabled={voice.connecting || blocked && !voice.connected} onClick={() => voice.connected ? voice.disconnect() : void voice.connect(true)}>{voice.connected ? '◼' : '◉'}</button>}
        </form>}
      <p className="notice" role="status">{voice.error || (pending.current?.state === 'unknown' ? 'Submission unconfirmed · no automatic resubmission' : availability)}</p>
    </div>
    {drawer && <aside id="work-record" aria-label="Work record"><div className="drawer-head"><h2>Codex work, quietly recorded.</h2><button onClick={() => setDrawer(false)} aria-label="Close work record">×</button></div>
      <p className="mode">Codex sibling review · same provider</p><p>Both workers use Codex. Review is a sibling pass on the same provider. Readiness is reported by the coordinator; saved output lights appear beside the river.</p>
      <p>Reviewed text only · tools disabled</p>
      {snapshot?.lastHeartbeat && <p>Last observation: {new Date(snapshot.lastHeartbeat).toLocaleTimeString('en')}</p>}
      {snapshot?.workers.map(worker => <div className="worker" key={worker.id}><strong>{worker.role === 'developer' ? 'Codex developer' : 'Codex sibling reviewer'}</strong><span>{worker.ready ? 'Reports ready' : 'Unavailable'}</span></div>)}
      {snapshot?.tasks.length === 0 && <p>No saved work yet.</p>}
      {snapshot?.tasks.map(task => <article key={task.id}><h3>{task.goal}</h3><small>{taskCaption(task)}</small>
        {task.runs.map(run => <details key={run.id}><summary>{run.role === 'developer' ? 'Codex developer' : 'Codex sibling reviewer'} · {runCaption(run)}</summary>
          <p>{run.code || 'No error code recorded.'}</p>{run.output && <pre>{run.output}</pre>}
          {run.evidenceSha256 && <p className="hash">Evidence SHA-256: {run.evidenceSha256}</p>}
          <small>Coordinator HTTP attempt: {run.attempt}</small></details>)}</article>)}
      {!snapshot && <p>{availability}</p>}
      <button className="return" onClick={() => setPosition({ x: 50, y: 31 })}>Bring the eyes home</button>
      {session && request && <button className="return" onClick={async () => {
        try { const response = await request('/api/session/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          await response.body?.cancel(); if (response.ok) expire(); } catch { setCaption('Sign out could not be confirmed.'); }
      }}>Sign out</button>}
    </aside>}
    <span hidden>{revision}</span>
  </main>;
}
createRoot(document.getElementById('root')!).render(<World />);
