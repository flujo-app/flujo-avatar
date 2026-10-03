# Flujo capability audit for the avatar interface

2 October 2026 · source analysis before interface design

Flujo is an agent workspace, configuration copilot, automation engine, MCP host, and experimental persistent-agent runtime. The proposed interface should give these existing capabilities characters and places. Treating it as a chat backend with a model picker would miss much of the product.

This audit examines a local Flujo working tree, main HEAD `15d019f7b952b2f2d3aea1197722ac8d9f520d7c`. That tree has pre-existing modifications, including execution events, conversation steering, MCP UI, OAuth, and package-transfer code. Findings describe the inspected local source, including those modifications. Source links point to the audit base commit; local differences are not published evidence. They do not certify a published release, deployment, provider account, or runtime test.

This is the baseline audit before implementation. The avatar integration was subsequently built on Flujo 3.46.2 in an isolated worktree and is published in [draft PR #560](https://github.com/mario-andreschak/FLUJO/pull/560). Refer to [the build log](BUILD_LOG.md) for implementation and runtime evidence; baseline statements about missing avatar integration are historical.

## 1. What a fresh installation already contains

An unconfigured installation has no usable work model, but it already has useful infrastructure:

- Initialization verifies storage and seeds the general-purpose **FLUJO agent** in the ordinary startup context. Its graph has an unbound Process step and deliberate tool selections for the four shipped MCP servers.
- Shipped server provisioning covers **Flujo control tools, filesystem, bash, and browser**. Records can be renamed, edited, or deleted by users; presence and connection status must be inspected rather than inferred from a package name.
- The home journey checks saved model, agent, and conversation counts. A model count is a configuration-presence signal, not proof of a successful model test.
- Guided AI Setup offers subscription, local, free gateway, and paid API paths. Installation guidance knows the server OS and install mode.
- Workspaces, encryption/lock controls, runtime settings, and exposure rules already exist.

**Interface consequence:** the opening can be visually empty while the infrastructure is already present. After connecting a model, discover and reuse the bundled agent and tools. Do not require everyone to build a new flow or connect those four tools from scratch.

Sources: [startup](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/init.ts#L433), [bundled agent](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/flow/defaultAgent.ts#L12), [shipped servers](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/mcp/shippedServers.ts#L25), [home readiness](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/app/page.tsx#L213).

## 2. Work models already include subscriptions

The model layer separates provider identity from completion adapter. It supports OpenAI-compatible and Responses paths, native Anthropic/Gemini, Azure, subscription adapters, local Ollama, and gateway/media routing. Connections include model-specific capability settings; not every control is meaningful for every adapter.

| Path | Actual Flujo behavior | Setup implication |
| --- | --- | --- |
| Codex / ChatGPT subscription | `@openai/codex-sdk`, with a workspace-isolated runtime and host-backed or explicitly workspace-owned login | A saved connection can have no API key. Current host-login reuse requires supported file-backed authentication. |
| Claude subscription | Claude Agent SDK with `CLAUDE_CODE_OAUTH_TOKEN` supplied from the saved connection | Current setup obtains a token through `claude setup-token`. An installed/logged-in Claude application is not sufficient proof that this isolated adapter is ready. |
| API / gateway | Provider profile, endpoint, credentials, discovery, and adapter-specific settings | Existing guided and manual paths remain useful alternatives. |
| Ollama | Server reachability, installed models, hardware capability probe, and suggested model | Existing local capability API is already a useful detection primitive. |

Both subscription adapters execute through **Flujo’s tool bridge**. Codex’s built-in shell is disabled; Claude’s built-in tools and host settings are excluded. Importing a subscription does not import every personal plugin, MCP server, skill, or permission from the user’s usual coding application. Flujo controls which tools are available and observes their calls/results.

Model bindings remain per Process step. Persona creation has an existing default-resolution mechanism: explicit Role default, authored Core/Behavior binding, then configured-model precedence. It fills missing bindings and preserves authored choices. There is no inspected universal switch that overrides all existing flows with one model.

**Interface consequence:** lead with usable existing Codex/Claude connections. Ask the user to choose a work brain, then bind it explicitly where needed. Preserve multi-model flows and Persona defaults. Keep live voice independent; these work adapters do not establish a native conversational-audio transport.

Sources: [provider/adapter types](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/model/provider.ts#L1), [Codex execution](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/model/adapters/codexAdapter.ts#L692), [Codex runtime isolation](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/model/adapters/codexRuntimeHome.ts#L22), [Codex auth constraints](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/model/adapters/codexAuth.ts#L21), [Claude execution/auth](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/model/adapters/claudeSubscriptionAdapter.ts#L285), [Claude runtime](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/model/adapters/claudeRuntimeHome.ts#L19), [Persona model resolution](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/enduringAgents/factory.ts#L246).

## 3. Detection is incomplete; verification is stronger than expected

`GET /api/setup/ai-cli` currently returns `platform`, `installMode`, and `oneClickInstall`. It does **not** return installed CLI versions, login state, subscription entitlement, or execution readiness. Its POST installs an allow-listed tool using WinGet. The wizard currently relies on a Codex login-complete checkbox or a pasted Claude token.

`GET /api/local-models/capability` already returns Ollama reachability, installed models, and machine capability. Codex also has an optional compatible-catalog cache, but it is an experimental execution workaround, not an account discovery service.

The existing model test does more than send “pong”: after transport succeeds, it exercises the production tool conversion/result loop using a diagnostic tool and an unpredictable receipt. The overall result includes that check. Dedicated media models skip tool testing. This is the right readiness primitive to reuse; a new avatar-specific model tester would duplicate important work.

**Interface consequence:** add a bounded, secret-free discovery projection around current adapters and setup facts. Present “detected”, “needs sign-in”, “unsupported credential storage”, “configured”, and “verified” distinctly. Test only the chosen connection through Flujo’s existing test path. CLI installation on PATH is not the same as availability of the runtime bundled by the SDK that actually executes it.

Sources: [CLI setup route](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/app/api/setup/ai-cli/route.ts#L16), [wizard host detection](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/models/ModelConnectionWizard.tsx#L340), [wizard confirmation/save](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/models/ModelConnectionWizard.tsx#L458), [local detection](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/app/api/local-models/capability/route.ts#L15), [model verification](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/model/testConnection.ts#L423), [tool receipt test](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/model/testToolConnection.ts#L22).

## 4. Ask FLUJO is an existing interface copilot

Ask FLUJO already:

- Reads page-owned context, including relevant unsaved state and advertised editable/highlight targets.
- Keeps generic page context to visible content/headings and excludes input values.
- Uses a selected tool-capable saved model and the four shipped MCP connections.
- Synthesizes a quick-chat flow and creates a normal persisted conversation with its flow snapshot.
- Receives model-proposed UI actions, validates them against the original page scope, and exposes Apply for edits.

Its specialized context types currently cover models, flows, and chat, with generic fallback for other pages. Avatar-driven Persona, automation, meeting, and app setup may need additional page registrations. A model connection is required today, so Ask FLUJO does not solve the empty-install voice bootstrap by itself.

**Interface consequence:** extend this copilot’s context/action contract and reuse its execution pattern. A character can point at a real control, explain a flow, or offer an edit. Any new presentation coordinator should manage voice/world correlation rather than reimplementing the copilot or inventing unrestricted UI automation.

Sources: [page contract](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/types/askFlujo.ts#L1), [context provider](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/contexts/AskFlujoContext.tsx#L1), [copilot prompt](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/AskFlujo/AskFlujoDock.tsx#L93), [normal conversation creation](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/AskFlujo/AskFlujoDock.tsx#L235).

## 5. Flujo can already author and configure its own work

The shipped `mcp-flujo` package forwards a closed set of control tools through domain-specific local routes. Its capabilities include:

- Find/list models, flows, servers, tools, conversations, and capabilities.
- Explain, update, execute, version, revert, and delete flows.
- List actual building blocks; author Guided SimpleFlowSpec or Advanced FlowSpec; validate, draft, and create flows.
- Suggest/apply tool selections and check flow plausibility.
- Research, find, and install MCP connections through existing installation consent/audit contracts.
- Create/update/run automations, create human tickets, and access persistent KV state.
- Read/update Persona composition.
- Propose exact UI highlight/edit actions.

The **bundled agent has a narrower initial allowlist** than the full control surface. It does not automatically receive every authoring, installation, automation mutation, or Persona operation. The avatar should expose tools deliberately through existing flow configuration.

The existing quick-chat endpoint builds an ephemeral flow from a selected model and tools without saving/running it. `model-agent` creates a persisted ordinary agent with an explicit creation identity. The production generator and optional vendored Flow Generator harden generated drafts; drafts are not synonymous with saved/runnable flows.

**Interface consequence:** use these discovery/compiler/tool paths for “set that up for me.” Most intelligence belongs in the selected Flujo model using existing tools. Bootstrap model login and a few missing configuration actions remain structured UI/API work.

Sources: [tool domains](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/mcp-servers/flujo/src/client.ts#L23), [authoring tools](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/mcp/flowAuthoringTools.ts#L88), [actual building blocks](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/flow/generationContext.ts#L77), [quick chat](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/app/api/flow/quick-chat/route.ts#L11), [saved model-agent](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/app/api/flow/model-agent/route.ts#L19), [UI proposal](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/mcp/internalTools.ts#L1770), [authoring profiles](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/docs/features/flowspec-ui-coverage.md#L1).

## 6. Flows are richer than one background task

The runtime supports Process, MCP, Resource, Static, Trigger, Signal, Subflow, Start, and Finish nodes; branching/handoffs, loops, parallel child queues, scoped history, and optional reusable child sessions. Guided and Advanced builders operate on the same runtime. Tools, prompts, model bindings, resources, and persistent state can be scoped within a graph.

**Interface consequence:** a workshop can represent a saved flow; several characters may represent actual specialist nodes/child lanes. A scenic character change must not create a backend handoff. Conversely, an actual handoff should retain its real execution identity and become understandable in the world.

Sources: [flow types](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/flow/flow.ts#L1), [runtime/authoring coverage](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/docs/features/flowspec-ui-coverage.md#L1), [subflow sessions](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/docs/features/subflow-session-scope.md#L1).

## 7. Personas are actual persistent residents

An experimental Persona is not merely a friendly skin. It has a pinned Role version, mission, Core Flow, callable Behavior flows, selected apps, memory, goals/work items, lifecycle, interruption policy, and reviewed improvement mechanisms. The runtime contains durable dispatch/admission, activity snapshots, leases, mailbox routing, recovery, and retention.

The product capability manifest identifies UI owners and recovery for lifecycle, goals, memory, abilities, behaviors, apps, improvements, conversations, meetings, automations, runtime recovery, privacy, and portability. Creation has draft/readiness checks rather than simply creating a name and picture.

There is already `projectPersonaRuntimePresentation`: a **passive** renderer-safe projection with idle, listening, thinking, using_app, waiting, speaking, and error states. It prevents an activity from a different Persona being projected as this one. It exists as a shared contract with tests; the inspected references do not establish that it is already served to a cinematic renderer.

**Interface consequence:** distinguish a presentation style from a resident Persona. Eyes/Moss/Orbit/Spark can be styles. A persistent resident corresponds to a real Persona with inspectable memory, abilities, goals, and controls. Do not replace the Persona runtime with a second avatar memory/task system. Its experimental maturity must remain visible in product decisions.

Sources: [Persona schema](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/enduringAgent/enduringAgent.ts#L241), [capability manifest](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/enduringAgent/personaCapabilityManifest.ts#L66), [creation wizard](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/Personas/PersonaCreationWizard.tsx#L117), [presentation projection](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/enduringAgent/voice.ts#L30), [goal state](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/enduringAgent/enduringAgent.ts#L847), [maturity](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/docs/project-status.md#L1).

## 8. Meetings and automations make the world active

Meetings can contain direct Flow or Persona participants. They persist shared rounds and participant conversations; policy includes concurrency, moderation, completion thresholds, and error behavior. A meeting is a backend operation with its own identity, not just multiple characters speaking spontaneously.

Automations bind a flow to schedule, webhook, file watch, MCP polling, URL watch, or flow completion/signal triggers. They have histories, overlap strategies, admission restrictions, pending-input/approval behavior, and Persona projections. The server must be running.

Waves and the Automation Map already resolve flows, executions, subflows, signals, packages, and their relations. The map deliberately provides sanitized trigger summaries. It can inform world connections rather than reconstructing an invented dependency graph in the renderer.

**Interface consequence:** meetings become a gathering place; automations become working mechanisms; a dependency can become a river/channel. Show actual next-run/status and distinguish a routine waiting for its trigger from an avatar thinking now.

Sources: [meetings](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/meetings/store.ts#L27), [triggers/policy](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/plannedExecution/plannedExecution.ts#L1), [automation map](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/waves/automationMap.ts#L1), [Waves](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/waves/waves.ts#L1).

## 9. Work is already observable and recoverable

Execution events cover run lifecycle, nodes, model dispatch/results, tools/progress/results, handoffs/subflows, resources, todos, approvals/questions/elicitation, debugging, errors, and recovery. They carry a durable monotonic sequence per conversation. Persisted state remains authoritative for reconnects.

Chat already exposes mid-run message injection, cancellation, recovery, branches/state editing, model-turn inspection, and debugger controls. Voice barge-in should stop speech immediately; changing work should use injection/steering; cancelling should use the target runtime’s cancellation control. Persona work has its own dispatcher/goal controls, so ordinary conversation cancellation must not be treated as universal cancellation.

**Interface consequence:** animate from existing events/projections, summarize meaningful milestones, and reconcile after reconnect. Do not build a second job queue or use speech/animation completion as execution evidence.

Sources: [events](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/execution/events.ts#L124), [chat controls](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/services/chat/index.ts#L599), [conversation cancellation](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/app/v1/chat/conversations/[conversationId]/cancel/route.ts#L1), [Persona dispatcher](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/backend/services/enduringAgents/personaDispatcher.ts#L3721).

## 10. Real screens and artifacts already have hosts

Flujo hosts MCP Apps through stable verified resources, separate sandbox origins, negotiated capabilities, and a persistent global host that survives navigation. It also embeds ordinary same-origin chat in Meetings. These are different integration surfaces and should remain distinct.

Run resources include text, images, audio, blobs, and links, with producer/read lineage and addressable `flujo://run/...` references. Flow KV supports persistent structured state. Human tickets preserve source conversation/flow links. Packages bundle configuration for flows, models, connections, automations, and Persona-related structures; the Flujo package registry is separate from the MCP server registry.

**Interface consequence:** in-world work surfaces can reuse hosted apps and real Flujo panels; objects can point to real resource identities and histories. A document appearing in the scene should open the actual document. Packages can populate useful world capabilities; they are not merely decorative asset packs.

Sources: [MCP App contract](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/docs/features/mcp/apps.md#L1), [persistent host](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/mcp/GlobalMcpAppsHost.tsx#L1), [resources](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/runResources.ts#L1), [tickets](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/docs/features/agent-tickets.md#L1), [packages](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/package/package.ts#L1).

## 11. Flujo already has a living world

The modern theme mounts `LivingWorldGate` and a canvas `RiverWorld`. A stable authored scene map associates routes with Headwater Springs (models), Connector Harbor (apps), Flowwright Workshop (flows), Conversation Cove (chat), Lockworks (automations), Wave Observatory, Riverside Market, Archive, and Control House. Camera travel follows navigation; motion preferences and a default-on appearance setting already exist.

This is a route-driven ambient presentation behind the ordinary application. It is not yet the avatar-led, capability-evolving primary interface described here. The scene map also does not currently give Personas, Roles, and Meetings dedicated entries.

**Interface consequence:** evaluate evolving the existing watershed rather than inventing a completely unrelated spatial vocabulary. A dark opening and white-eyed guide can bring that world into view. Persistent residents, active work, and resource-driven changes are the missing interaction layer.

Sources: [world gate](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/AmbientWorld/LivingWorldGate.tsx#L1), [destinations](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/AmbientWorld/sceneMap.ts#L1), [renderer lifecycle](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/AmbientWorld/RiverWorld.tsx#L45), [application hosts](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/frontend/components/AppWrapper.tsx#L208).

## 12. Voice is a separate capability

Flujo’s speech settings/file transcription are not the POC’s native conversation engine. Persona presentation voice metadata is also not a functioning live transport. Subscription readiness must not imply voice readiness.

The POC’s accepted Spanish interaction uses native GPT Audio through OpenRouter: completed audio input followed by streamed native speech. Preserve that adapter first. Our hosted/bootstrap service remains available independently of the user’s work connection, including when no model exists. Keep a replacement transport boundary so the world is not tied to a particular voice model.

Only bounded presentation context should reach our conversation service. Once the work connection exists, substantive planning and configuration decisions use the selected Flujo model. Raw subscription credentials, full tool outputs, memory stores, or provider logs should not be copied to the voice lane by default.

Sources: [Flujo speech settings](https://github.com/mario-andreschak/FLUJO/blob/15d019f7b952b2f2d3aea1197722ac8d9f520d7c/src/shared/types/storage/storage.ts#L133), the reviewed native audio adapter, [OpenRouter audio contract](https://openrouter.ai/docs/guides/overview/multimodal/audio).

## Recommended foundation

Build the interface around **existing Flujo identity and execution**:

1. Eyes + our voice service bootstrap setup before a work model exists.
2. Detect host/runtime/login candidates and reuse existing model tests.
3. Bind a verified subscription/API/local connection to the appropriate existing agent/copilot path.
4. Expose useful existing authoring, app, and automation capabilities deliberately.
5. Give saved Flow agents a visible representation and real Personas persistent residence.
6. Project execution/events/resources into the existing world vocabulary.
7. Preserve real panels, MCP App hosting, workspace boundaries, and runtime recovery.

The genuinely new work is connection discovery, avatar/voice orchestration, presentation contracts where missing, and world interaction. The backend already owns reasoning execution, tool calling, flow authoring, goals, memory, scheduling, and recoverable state.

This was a read-only capability audit. No Flujo/POC source, settings, logins, credentials, processes, or model allowances were changed. Existing test implementations were inspected as contract evidence; no new live-provider test was run.
