import { snapshotNativeVoiceTransport, type NativeVoiceTransport, type AvatarVoiceEndpoint } from './nativeVoiceTransport';
import type { Locale } from './locale';

/** Host opt-in after qualification. This descriptor is not a server grant.
 * The callback owns the authenticated route and captured session; revision is public. */
export interface AcceptedTaskNarrationBinding {
  readonly revision: string;
  readonly selectedTaskId: () => string | null;
  readonly postNarration: (init: RequestInit) => Promise<Response>;
}

export interface AcceptedTaskNarrationSelection {
  readonly taskId: string;
  readonly locale: Locale;
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function selection(init: RequestInit): AcceptedTaskNarrationSelection {
  if (init.method !== 'POST' || typeof init.body !== 'string' || init.body.length > 8192) {
    throw new Error('invalid_narration_selection');
  }
  let value: unknown;
  try { value = JSON.parse(init.body); } catch { throw new Error('invalid_narration_selection'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_narration_selection');
  const body = value as Record<string, unknown>;
  // The existing audio hook supplies avatar; the server chooses it for narration.
  // Caller facts, result references and authority are never forwarded.
  if (Object.keys(body).some(key => !['taskId', 'locale', 'avatar'].includes(key))
    || typeof body.taskId !== 'string' || !UUID_V4.test(body.taskId)
    || !['en', 'es', 'pt'].includes(body.locale as string)) throw new Error('invalid_narration_selection');
  return { taskId: body.taskId, locale: body.locale as Locale };
}

/** Separate, disabled-by-default adapter. Never installs a route or enables voice.
 * The host validates selected-task membership and all grants again at the server.
 * Responses and cancellation remain owned by the injected authenticated callback. */
export function createAcceptedTaskNarrationTransport(
  base: NativeVoiceTransport, binding?: AcceptedTaskNarrationBinding,
): NativeVoiceTransport {
  const captured = snapshotNativeVoiceTransport(base);
  if (binding && (typeof binding.revision !== 'string' || !binding.revision || binding.revision.length > 128
    || typeof binding.selectedTaskId !== 'function' || typeof binding.postNarration !== 'function')) {
    throw new Error('invalid_narration_binding');
  }
  const revision = binding?.revision ?? null;
  const selectedTaskId = binding?.selectedTaskId.bind(binding);
  const postNarration = binding?.postNarration.bind(binding);
  // Unambiguous public identity; changing admission disconnects the old voice owner.
  const scopeKey = JSON.stringify([captured.scopeKey, 'accepted-task-narration', revision]);
  if (scopeKey.length > 512) throw new Error('invalid_narration_binding');
  return Object.freeze({
    scopeKey, workletUrl: captured.workletUrl,
    request: async (endpoint: AvatarVoiceEndpoint, init: RequestInit) => {
      if (endpoint === 'native-result-receipt') throw new Error('narration_receipt_route_disabled');
      if (endpoint !== 'native-result') return captured.request(endpoint, init);
      if (!selectedTaskId || !postNarration) throw new Error('narration_transport_disabled');
      init.signal?.throwIfAborted();
      const input = selection(init);
      if (selectedTaskId() !== input.taskId) throw new Error('narration_selection_changed');
      const headers = new Headers(init.headers); headers.set('Content-Type', 'application/json');
      return postNarration({ ...init, method: 'POST', headers, body: JSON.stringify(input) });
    },
  });
}
