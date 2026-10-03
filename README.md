# Flujo Avatar

Black and white eyes in a world that evolves from real Flujo state. Flujo remains the backend, execution engine and embedded control surface. Our OpenRouter conversation service handles voice before setup; the user connects their own subscription, API or local model for thinking and work.

English is the default language for the avatar interface and voice. Spanish and Brazilian Portuguese remain selectable, and a saved workspace language choice is respected.

The current direction is a playful physical world: the eyes travel to small sculpted places beside a river. Saved capabilities grow plants and lights; an automation turns its windmill only while it is actually running. Controls and the full transcript open on demand. Gaze, floating motion and speech loudness give the eyes a physical presence, with reduced-motion support.

This repository owns the portable eyes, read-only presentation package and native audio adapter. Flujo's `/world` integration is in [draft PR #560](https://github.com/mario-andreschak/FLUJO/pull/560). The voice starts before a work model exists; the selected work AI uses Flujo's actual tools, conversations and resources. Saved Flow and Persona selection preserve their own models and runtime ownership. Human voice acceptance remains pending.

Run `npm ci` and `npm test` here. To synchronize the adapter into a Flujo checkout, run `npm run sync:flujo -- <checkout>`. The tracked copy and content hashes keep Flujo's standalone distribution self-contained; see [source provenance](NOTICE.md).

In the Flujo checkout, run `npm ci`, `npm run build`, then `npm start -- -p 43945 -H 127.0.0.1`, and open `/world`. Supply `FLUJO_AVATAR_OPENROUTER_KEY` (or `OPENROUTER_API_KEY`) to the Flujo server process for the bootstrap service. It is independent of saved workspace work-model credentials. No key is bundled or sent to the browser. Voice endpoints currently require loopback access.

The microphone captures complete utterances, with native OpenRouter audio and local interruption handling. Text remains available; “Hear the companion” enables output without microphone access. This is an endpointed HTTP conversation transport. [OpenRouter's native audio contract](https://openrouter.ai/docs/guides/overview/multimodal/audio) supports streamed audio and captions; persistent duplex transport remains replaceable future work.

After work setup, a spoken request goes directly through recognition to the selected Flujo AI. The voice service narrates the recorded outcome once, briefly, without an extra setup acknowledgement. Each narration uses current server facts and excludes old setup advice. Subscription setup starts with a deliberate model choice; local catalog hints expire after 24 hours and never establish access without a successful test.

Current evidence: 39 package/adapter tests and focused Flujo tests; English and Spanish bootstrap conversation; a real Codex `gpt-5.5` diagnostic and Flujo tools; persisted artifacts with preview/reload; canonical-result audio; saved Flow and Persona memory responses; steering, cancellation and approval recovery; a completed Flow/Persona meeting; a manual automation result; local package creation; and an MCP App session retained across embedded-panel navigation. The world reads installed-package facts from Flujo's workspace ledger. TypeScript, lint, the final production build, keyboard/reduced-motion controls and a 390px identity layout passed. Human microphone acceptance remains pending.

Guide links open supported Flujo controls inside the world through the existing workspace boundary. UI proposals recover their original panel scope from saved conversation history, and Apply validates that the same source panel is still present. Configuration remains in Flujo's real controls.

The compiled React package exports `Eyes`, `FactoryAvatar` and their types from `@flujo-ai/avatar`, with the explicit stylesheet `@flujo-ai/avatar/styles.css`. It supports React 18/19 peers. `FactoryAvatar` consumes host-validated observations and an inspection callback; it has no backend client, poller, voice or execution callback. ES/PT/EN captions distinguish recorded state, stale data and unverified worker activity.

Run `npm run example:build`, then `npm run example` for the React 18/Vite consumer at `http://127.0.0.1:43946/`. Its sample-data notice stays visible in every mode. A React 19 project can be checked with `node scripts/check-react19.mjs <installed-project> --serve`. Both runtime versions were browser-tested, including keyboard inspection, equal-revision heartbeat replacement, unavailable/stale states and reduced motion. Package import/install and owner boundaries are documented in [the Brain handoff](BRAIN_ONLINE_HANDOFF.md). The package remains private to npm; no registry publication has occurred.

Read [the vision](VISION.md), [the source audit](FLUJO_CAPABILITIES.md), [connection discovery](CONNECTION_DISCOVERY.md), and [build evidence](BUILD_LOG.md).
