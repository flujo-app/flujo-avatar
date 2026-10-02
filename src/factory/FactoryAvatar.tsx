import Eyes, { type AvatarStyle } from '../client/Eyes.js';
import styles from './factory.module.css';

export type AvatarLocale = 'es' | 'pt' | 'en';
export interface FactoryAvatarObservation {
  factoryId: string; revision: number; cursor: string; observedAt: string;
  readState: 'fresh' | 'stale' | 'unavailable' | 'preview'; mission: string;
  selectedCell?: { id: string; purpose: string; heartbeat: string; reportedStatus: 'reserved' | 'ready' | 'retired'; activityEvidence: 'idle' | 'recent' | 'uncertain' };
  selectedTask?: { id: string; attempt: number; owner: string | null; reportedStatus: 'ready' | 'running' | 'review' | 'verified' | 'delivered' | 'rejected'; candidateDigest: string | null; reviewEvidenceDigest: string | null };
  unresolvedEffects: number; effectsDrained: boolean; workerQuiescence: 'unverified'; commands: false; voice: false;
}
export interface FactoryAvatarProps {
  observation: FactoryAvatarObservation | null; avatar: AvatarStyle; locale: AvatarLocale;
  onInspect(target: { kind: 'cell' | 'task' | 'effect'; id: string }): void;
}
const copy = {
  en: { label: 'Factory companion', preview: 'Sample data', stale: 'Last observation · connection stale', unavailable: 'Factory unavailable. No current observation.', fresh: 'Factory observation', task: 'Recorded task', attempt: 'Attempt', cell: 'Cell', heartbeat: 'Worker heartbeat', evidence: 'Activity evidence', recent: 'Recent lease and heartbeat evidence', uncertain: 'Activity uncertain', idle: 'No running task recorded', worker: 'Current worker state is unverified.', effects: 'Unresolved external effects', drained: 'External effects are recorded as drained.', inspect: 'Inspect', readonly: 'Read-only · voice and execution unavailable', revision: 'Revision', observed: 'Snapshot read', candidate: 'Candidate evidence', review: 'Review evidence', status: { reserved: 'reserved', ready: 'ready', retired: 'retired', running: 'running', review: 'under review', verified: 'verified', delivered: 'delivered', rejected: 'rejected' } },
  es: { label: 'Compañero de la fábrica', preview: 'Datos de ejemplo', stale: 'Última observación · conexión desactualizada', unavailable: 'Fábrica no disponible. No hay observación actual.', fresh: 'Observación de la fábrica', task: 'Tarea registrada', attempt: 'Intento', cell: 'Célula', heartbeat: 'Última señal del trabajador', evidence: 'Evidencia de actividad', recent: 'Evidencia reciente de señal y autorización', uncertain: 'Actividad incierta', idle: 'Ninguna tarea en ejecución registrada', worker: 'El estado actual de los trabajadores no está verificado.', effects: 'Efectos externos sin resolver', drained: 'Los efectos externos figuran como resueltos.', inspect: 'Inspeccionar', readonly: 'Solo lectura · voz y ejecución no disponibles', revision: 'Revisión', observed: 'Lectura del estado', candidate: 'Evidencia del candidato', review: 'Evidencia de revisión', status: { reserved: 'reservada', ready: 'lista', retired: 'retirada', running: 'en ejecución', review: 'en revisión', verified: 'verificada', delivered: 'entregada', rejected: 'rechazada' } },
  pt: { label: 'Companheiro da fábrica', preview: 'Dados de exemplo', stale: 'Última observação · conexão desatualizada', unavailable: 'Fábrica indisponível. Sem observação atual.', fresh: 'Observação da fábrica', task: 'Tarefa registrada', attempt: 'Tentativa', cell: 'Célula', heartbeat: 'Último sinal do trabalhador', evidence: 'Evidência de atividade', recent: 'Evidência recente de sinal e autorização', uncertain: 'Atividade incerta', idle: 'Nenhuma tarefa em execução registrada', worker: 'O estado atual dos trabalhadores não está verificado.', effects: 'Efeitos externos pendentes', drained: 'Os efeitos externos constam como resolvidos.', inspect: 'Inspecionar', readonly: 'Somente leitura · voz e execução indisponíveis', revision: 'Revisão', observed: 'Leitura do estado', candidate: 'Evidência do candidato', review: 'Evidência de revisão', status: { reserved: 'reservada', ready: 'pronta', retired: 'retirada', running: 'em execução', review: 'em revisão', verified: 'verificada', delivered: 'entregue', rejected: 'rejeitada' } },
} as const;
const instant = (value: string, locale: AvatarLocale) => new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'medium' });

/** Pure presentation of host-validated facts. Never reads or dispatches backend work. */
export function FactoryAvatar({ observation, avatar, locale, onInspect }: FactoryAvatarProps) {
  const c = copy[locale], state = observation?.readState ?? 'unavailable';
  const available = observation && state !== 'unavailable';
  const task = available ? observation.selectedTask : undefined;
  const cell = available ? observation.selectedCell : undefined;
  return <section className={styles.companion} aria-label={c.label} data-read-state={state}>
    <div className={styles.notice}>{state === 'preview' ? c.preview : state === 'stale' ? c.stale : state === 'unavailable' ? c.unavailable : c.fresh}</div>
    <Eyes avatar={avatar} phase={available ? 'idle' : 'error'} small />
    <h2>{available ? observation.mission : c.label}</h2>
    <p className={styles.caption} role="status" aria-live="polite">{task ? `${c.task} ${task.id}: ${c.status[task.reportedStatus]}. ${c.attempt} ${task.attempt}.` : available ? c.worker : c.unavailable}</p>
    {available && <>
      <div className={styles.authority}>{observation.factoryId} · {c.revision} {observation.revision}<br />{c.observed}: <time dateTime={observation.observedAt}>{instant(observation.observedAt, locale)}</time></div>
      {cell && <div className={styles.fact}><h3>{c.cell} · {cell.id}</h3><p>{cell.purpose}</p><dl><dt>{c.heartbeat}</dt><dd><time dateTime={cell.heartbeat}>{instant(cell.heartbeat, locale)}</time></dd><dt>{c.evidence}</dt><dd>{c[cell.activityEvidence]}</dd></dl><button type="button" onClick={() => onInspect({ kind: 'cell', id: cell.id })}>{c.inspect} · {cell.id}</button></div>}
      {task && <div className={styles.fact}><h3>{c.task} · {task.id}</h3><p>{c.status[task.reportedStatus]} · {c.attempt} {task.attempt}</p>{task.candidateDigest && <p>{c.candidate}: <code>{task.candidateDigest}</code></p>}{task.reviewEvidenceDigest && <p>{c.review}: <code>{task.reviewEvidenceDigest}</code></p>}<button type="button" onClick={() => onInspect({ kind: 'task', id: task.id })}>{c.inspect} · {task.id}</button></div>}
      <p>{observation.effectsDrained ? c.drained : `${c.effects}: ${observation.unresolvedEffects}.`} {c.worker}</p>
    </>}
    <footer>{c.readonly}</footer>
  </section>;
}
