# Flujo Avatar

Black and white eyes in a world that evolves from real Flujo state. Flujo remains the backend, execution engine and embedded control surface. Our OpenRouter conversation service handles voice before setup; the user connects their own subscription, API or local model for thinking and work.

This repository owns the portable eyes and native audio adapter. Flujo's `/world` integration is being built in [draft PR #560](https://github.com/mario-andreschak/FLUJO/pull/560). The voice starts before a work model exists; the selected work AI uses Flujo's actual tools, conversations and resources. Operational Flow/Persona selection and broader capability journeys remain in progress.

Run `npm ci` and `npm test` here. To synchronize the adapter into a Flujo checkout, run `npm run sync:flujo -- <checkout>`. The tracked copy and content hashes keep Flujo's standalone distribution self-contained; see [source provenance](NOTICE.md).

In the Flujo checkout, run `npm ci`, `npm run build`, then `npm start -- -p 43945 -H 127.0.0.1`, and open `/world`. Supply `FLUJO_AVATAR_OPENROUTER_KEY` (or `OPENROUTER_API_KEY`) to the Flujo server process for the bootstrap service. It is independent of saved workspace work-model credentials. No key is bundled or sent to the browser. Voice endpoints currently require loopback access.

The microphone captures complete utterances, with native OpenRouter audio and local interruption handling. Text remains available; “Hear the companion” enables output without microphone access. This is an endpointed HTTP conversation transport. [OpenRouter's native audio contract](https://openrouter.ai/docs/guides/overview/multimodal/audio) supports streamed audio and captions; persistent duplex transport remains replaceable future work.

Current evidence: 33 adapter/playback/utterance tests and focused Flujo tests; a production browser reply in Spanish with no work model; a real Codex `gpt-5.5` model/tool diagnostic; and read-only Flujo tool execution through the avatar. Human microphone acceptance and the broader capability journeys are still pending.

Read [the vision](VISION.md), [the source audit](FLUJO_CAPABILITIES.md), [connection discovery](CONNECTION_DISCOVERY.md), and [build evidence](BUILD_LOG.md).
