# Source provenance

The native voice stream parser, playback ledger, microphone collector and WAV utilities were extracted from the user-owned avatar proof of concept. Domain-specific adapters, banking prompts, identity and account routes are excluded. The generic protocol is adapted to awaited event sinks for Flujo's Web Streams routes.

Flujo includes a synchronized copy under `src/vendor/avatar`, with per-file SHA-256 hashes. Changes originate here and are synchronized with `npm run sync:flujo -- <Flujo checkout>`. This preserves one editable source while keeping Flujo's standalone npm distribution self-contained.

The OpenRouter adapter accepts complete utterances and streams native audio. It is an endpointed HTTP conversation transport; persistent live duplex transport remains replaceable future work. The output sample rate remains the reviewed 24 kHz packaging assumption and is explicitly reported by the protocol.
