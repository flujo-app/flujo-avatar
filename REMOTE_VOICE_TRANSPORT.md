# Host-owned voice transport

The source adapter accepts an optional `NativeVoiceTransport` through `useNativeRouterVoice`. The local default preserves `/api/avatar/*`, `/avatar-audio-capture.js`, JSON bodies, locale and the non-authorizing `x-flujo-avatar-client` correlation header.

An authenticated host supplies an immutable `scopeKey`, `workletUrl` and `request(endpoint, init)` callback. The callback must capture its authenticated principal/session/workspace/revocation scope, preserve the abort signal, and add its own same-origin credentials and CSRF policy. A scope key is correlation, never an authorization credential. No host bearer is part of this interface.

Each connection captures the callback, scope and worklet once. A scope replacement disconnects capture, pending recognition, streamed playback and receipts; late old-scope responses are cancelled and cannot deliver work. HTTP 401 or 403 closes the voice session. Same-scope history resets serialize; another scope remains independent. Every reset sends exactly `{}` and a failed reset does not poison reconnection. Hosts remain responsible for real server authorization, scope changes and in-flight revocation.

This is portable source synchronized into Flujo, not a new npm package export. Use `node scripts/sync-flujo.mjs <Flujo-checkout>`; the generated provenance records all 18 adapter/worklet file hashes. Copy `tests/integration/useNativeRouterVoice.test.tsx` to `__tests__/frontend/hooks/useNativeRouterVoice.test.tsx` in the consumer to run the mounted qualification with its own lockfile.

Qualification: 44 package/adapter tests, including five transport tests with a real loopback HTTP fixture; 8 mounted React hook tests in a Flujo checkout with independently installed dependencies. The first mounted run caught a capture session remaining connected after a recognition 401; the final run passes after teardown was added. Fixtures use no microphone hardware, upstream model or production credential. Cloud hosting, voice provider availability and human microphone acceptance are separate evidence.
