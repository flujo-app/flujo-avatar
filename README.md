# Savia avatar

The [Flujo Avatar SDK](packages/avatar-sdk/README.md) packages presentation,
World terrain and the host-owned native voice hook as `@flujo-ai/avatar-sdk`.
Build with `npm run build` and create an installable archive with `npm run pack:sdk`.

Savia is the customer's AI assistant: one conversation that owns a problem through resolution or a tracked human handoff. Black and white eyes live in a world that evolves from real Flujo state. Flujo remains the orchestration, MCP, chat, API, workspace and recovery foundation; O/FACTORY/Seagulled supply coordination, execution and review.

When Savia cannot resolve a problem immediately, it reuses the recovered Claude swarm-teams implementation: `swarm_agent`, `swarm_team`, `swarm_supervisor` and the `swarm_boot` clone flow. Specialize the existing tasks, roles and instructions for the customer's problem. The target is ten Fly FLUJO Machines, each running one lead plus nine specialist conversations: 100 other AIs, with Savia's root supervision separate. The selected Savia team must use a native subflow concurrency bound of nine. Logical members, active conversations and Machines have separate counts; show measured working capacity separately from this exact target. A new role manifest or orchestration engine is not a prerequisite.

The integration must keep the customer informed through Savia in their signed-in session and through existing notification integrations. When work cannot be completed, the existing ticket integration must carry useful context, evidence and attempted actions, with Savia continuing status and follow-up. This repository does not introduce another orchestration, ticketing or notification engine.

For a fresh owner workspace, our OpenRouter conversation service works before AI setup; the owner connects their own subscription, API or local model for thinking and work. This setup capability remains available through Flujo's real controls.

Optional [local Pocket speech](LOCAL-SPEECH.md) uses Anna for English and
language-specific presets. The existing OpenRouter conversation/speech path remains.

English is the default language for the avatar interface and voice. Spanish and Brazilian Portuguese remain selectable, and a saved workspace language choice is respected.

The current direction is a playful physical world: the eyes travel to small sculpted places beside a river. Saved capabilities grow plants and lights; an automation turns its windmill only while it is actually running. Controls and the full transcript open on demand. Gaze, floating motion and speech loudness give the eyes a physical presence, with reduced-motion support.

This repository owns the portable eyes, read-only presentation package and native audio adapter. Flujo's `/world` integration is in [draft PR #560](https://github.com/mario-andreschak/FLUJO/pull/560). The voice starts before a work model exists; the selected work AI uses Flujo's actual tools, conversations and resources. Saved Flow and Persona selection preserve their own models and runtime ownership. Human voice acceptance remains pending.

Run `npm ci` and `npm test` here. To synchronize the adapter into a Flujo checkout, run `npm run sync:flujo -- <checkout>`. The tracked copy and content hashes keep Flujo's standalone distribution self-contained; see [source provenance](NOTICE.md).

In the Flujo checkout, run `npm ci`, `npm run build`, then `npm start -- -p 43945 -H 127.0.0.1`, and open `/world`. Supply `FLUJO_AVATAR_OPENROUTER_KEY` (or `OPENROUTER_API_KEY`) to the Flujo server process for the bootstrap service. It is independent of saved workspace work-model credentials. No key is bundled or sent to the browser. Voice endpoints currently require loopback access.

The microphone captures complete utterances, with native OpenRouter audio and local interruption handling. Text remains available; “Hear the companion” enables output without microphone access. This is an endpointed HTTP conversation transport. [OpenRouter's native audio contract](https://openrouter.ai/docs/guides/overview/multimodal/audio) supports streamed audio and captions; persistent duplex transport remains replaceable future work.

After work setup, a spoken request goes directly through recognition to the selected Flujo AI. The voice service narrates the recorded outcome once, briefly, without an extra setup acknowledgement. Each narration uses current server facts and excludes old setup advice. Subscription setup starts with a deliberate model choice; local catalog hints expire after 24 hours and never establish access without a successful test.

Recorded local evidence, separate from deployed Savia acceptance: 39 package/adapter tests and focused Flujo tests; English and Spanish bootstrap conversation; a real Codex `gpt-5.5` diagnostic and Flujo tools; persisted artifacts with preview/reload; canonical-result audio; saved Flow and Persona memory responses; steering, cancellation and approval recovery; a completed Flow/Persona meeting; a manual automation result; local package creation; and an MCP App session retained across embedded-panel navigation. The world reads installed-package facts from Flujo's workspace ledger. TypeScript, lint, the final production build, keyboard/reduced-motion controls and a 390px identity layout passed. Human microphone acceptance remains pending.

Guide links open supported Flujo controls inside the world through the existing workspace boundary. UI proposals recover their original panel scope from saved conversation history, and Apply validates that the same source panel is still present. Configuration remains in Flujo's real controls.

The compiled React package exports `Eyes`, `FactoryAvatar` and their types from `@flujo-ai/avatar`, with the explicit stylesheet `@flujo-ai/avatar/styles.css`. It supports React 18/19 peers. `FactoryAvatar` consumes host-validated observations and an inspection callback; it has no backend client, poller, voice or execution callback. ES/PT/EN captions distinguish recorded state, stale data and unverified worker activity.

Run `npm run example:build`, then `npm run example` for the React 18/Vite consumer at `http://127.0.0.1:43946/`. Its sample-data notice stays visible in every mode. A React 19 project can be checked with `node scripts/check-react19.mjs <installed-project> --serve`. Both runtime versions were browser-tested, including keyboard inspection, equal-revision heartbeat replacement, unavailable/stale states and reduced motion. Package import/install and owner boundaries are documented in [the Brain handoff](BRAIN_ONLINE_HANDOFF.md). The package remains private to npm; no registry publication has occurred.

Read [the vision](VISION.md), [the source audit](FLUJO_CAPABILITIES.md), [connection discovery](CONNECTION_DISCOVERY.md), and [build evidence](BUILD_LOG.md).

The source adapter also accepts a [host-owned authenticated transport](REMOTE_VOICE_TRANSPORT.md). A [mountable development world](DEVELOPMENT_WORLD.md) reuses the physical scene for O's same-host coordinator, with task intake and current-state SSE. Its static artifact and local fixtures are separate from the full Flujo `/world` application.

The customer-facing assistant is **Savia**, using the FLUJO World visual theme. O/FACTORY/Seagulled and Flujo remain the underlying ecosystem. The [integration plan](INTERFACE_INTEGRATION.md) maps the existing swarm-teams route and the setup, work, voice and control capabilities to retain. Existing recovered swarm evidence remains accepted within its measured scope; it does not alone establish the simultaneous ten-Machine × ten-conversation customer run. Full operational integration, actual visual acceptance and human microphone acceptance remain pending.

The optional [World and sky camera](WORLD_SKY.md) keeps the existing world and swarm surfaces mounted while the user scrolls between them. It consumes host-validated observations and returns scoped presentation intent; instance access and live voice stay with their authorized hosts.

The separate [canonical World presentation entry](WORLD_PACKAGE.md) packages the exact approved terrain, camera and eyes with explicit CSS and installable declarations. Production can adopt it under a separate dependency alias while retaining its existing Avatar Factory package.

The separate `createAcceptedTaskNarrationTransport` export at `@flujo-ai/avatar/voice-transport` prepares the proposed accepted-task narration bridge. It is disabled when no host binding is supplied and refuses generic result/receipt forwarding. A qualified host supplies a public revision, a current accepted-task selector and an authenticated POST callback. The callback receives only UUIDv4 `taskId` and exact `en`/`es`/`pt` `locale`; avatar is selected at the server. Caller result facts and authority fields are refused. Streams, failures and cancellation pass through unchanged. This helper installs no route and enables no current World voice capability; O's route, profile, grants and runtime remain pending qualification.

