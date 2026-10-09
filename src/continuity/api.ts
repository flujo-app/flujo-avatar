import { parseSession, parseDevelopmentState, type BrowserSession, type DevelopmentState } from './protocol';
import type { AvatarVoiceEndpoint, NativeVoiceTransport } from '../client/nativeVoiceTransport';

export class SessionExpired extends Error {}
export async function boundedJson(response: Response, limit = 2 * 1024 * 1024): Promise<unknown> {
  const reader = response.body?.getReader(); if (!reader) throw new Error('empty_response');
  const chunks: Uint8Array[] = []; let length = 0;
  try { for (;;) { const { value, done } = await reader.read(); if (done) break;
    length += value.byteLength; if (length > limit) throw new Error('response_limit'); chunks.push(value);
  } } catch (error) { await reader.cancel().catch(() => {}); throw error; } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
export async function browserSession(signal: AbortSignal): Promise<BrowserSession> {
  const response = await fetch('/api/avatar/session', { credentials: 'same-origin', cache: 'no-store', signal });
  if (response.status === 401 || response.status === 403) { await response.body?.cancel(); throw new SessionExpired(); }
  if (!response.ok) { await response.body?.cancel(); throw new Error('session_unavailable'); }
  try { return parseSession(await boundedJson(response, 8192)); }
  catch { throw new SessionExpired(); } // A changed/invalid scope revokes old capture and receipts.
}
export function sessionRequest(session: BrowserSession, signal: AbortSignal, onExpired: () => void) {
  // Capture the public session once; the cookie remains HttpOnly and server-validated.
  const scope = Object.freeze({ ...session });
  return async (path: string, init: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(init.headers);
    headers.set('x-o-development-namespace', scope.namespace);
    if ((init.method ?? 'GET') !== 'GET') headers.set('x-o-csrf', scope.csrfToken);
    const response = await fetch(path, { ...init, headers, credentials: 'same-origin', cache: 'no-store',
      signal: AbortSignal.any([signal, ...(init.signal ? [init.signal] : [])]) });
    if (response.status === 401 || response.status === 403) onExpired();
    return response;
  };
}
export function voiceTransport(session: BrowserSession, request: ReturnType<typeof sessionRequest>): NativeVoiceTransport {
  return Object.freeze({ scopeKey: session.scopeKey, workletUrl: '/world/avatar-audio-capture.js',
    request: (endpoint: AvatarVoiceEndpoint, init: RequestInit) => request('/api/avatar/remote/' + (endpoint === 'voice' ? 'availability' : endpoint), init) });
}
export async function readState(response: Response, session: BrowserSession): Promise<DevelopmentState> {
  if (!response.ok) { await response.body?.cancel(); throw new Error('state_unavailable'); }
  return parseDevelopmentState(await boundedJson(response), session);
}
