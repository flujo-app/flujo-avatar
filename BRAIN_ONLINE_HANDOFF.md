# Avatar → brain-online handoff

2 October 2026. Moe's direct instruction to coordinate this chat as a subworker was verified in the Brain chat `01a0fed9-5f1a-70c1-a9da-b7354bfe89d2`. Brain owns integration and its repository; FACTORY owns execution. This workstream owns reusable avatar presentation and the Flujo integration. Neither owner's worktree was edited.

## Audited sources and identities

| Workstream | Source / revision | Review |
| --- | --- | --- |
| Portable avatar | [flujo-app/flujo-avatar](https://github.com/flujo-app/flujo-avatar), `34fd967` | Public main; eyes, capture/playback and heard-response ledger |
| Flujo host integration | [mario-andreschak/FLUJO](https://github.com/mario-andreschak/FLUJO), `ac5ee9a1`, `codex/avatar-world` | [Draft PR #560](https://github.com/mario-andreschak/FLUJO/pull/560) |
| Brain host | [flujo-app/brain-online](https://github.com/flujo-app/brain-online), `9cbc8f961e86ab8301ecdb40869325ff9ec7107f` | [PR #34](https://github.com/flujo-app/brain-online/pull/34) |
| FACTORY | Local checkout `C:/Users/Moe/Documents/ChatGPT/FACTORY`, HEAD `8d8e58f7fae96bc2eec05cbc3685368e1228acfe` | No `origin` remote is configured; running presentation build has a separate identity |

Contracts read: FACTORY's `BRAIN_ONLINE_INTEGRATION.md`; Brain's `docs/FACTORY_INTEGRATION.md`; Brain's `packages/shared/src/factory.ts` and `apps/dashboard/src/pages/Factory.tsx`. The contract is staff-only, one local authority, read-only, `commands: false`. Customer tenancy, command admission and paid voice are outside this first bridge.

## What is reusable now

These are actual **source-file exports**. `package.json` is private and currently has no npm `exports`, compiled distribution, peer dependencies or public registry release. A package-name import is not ready yet.

```ts
// src/client/Eyes.tsx: default React component
type AvatarStyle = 'moss' | 'orbit' | 'spark';
type EyePhase = 'idle' | 'listening' | 'thinking' | 'speaking'
  | 'usingApp' | 'waiting' | 'error';
type EyesProps = { phase: EyePhase; avatar: AvatarStyle; small?: boolean };
// Also requires the sibling eyes.module.css.
```

The eyes use React hooks available in React 18 and 19, CSS modules and pointer events. They have no Flujo state or API dependency. CSS disables gaze/animation under reduced motion. The host supplies accessible status text because the eyes are decorative (`aria-hidden`). React 18/Vite acceptance has not yet been run.

The native adapter exports `useNativeRouterVoice`, `voiceHeaders`, `NativeRouterPlayback`, `NativeTurnProtocol`, `readNativeTurn`, `createNativeTurns` and `streamNativeTurn`. Playback and ledger are generic; the hook's URLs are currently `/api/avatar/native-*` and its capture worklet is `/avatar-audio-capture.js`. Its session header is `x-flujo-avatar-client`. The Flujo host resolves the current workspace and canonical conversation/message result before issuing a single-use narration receipt. Those URLs and Flujo's result resolver must not be copied as a FACTORY command contract.

```ts
// Actual server adapter boundary: src/server/openrouter-native.d.mts
streamNativeTurn(payload, { openrouterKey }, fetchImpl, signal, emit, {
  turnId, history?, backendResult?, setupFacts?, onQualifiedResult?
}): Promise<NativeResult>;
// emit is awaited; a qualified result is separate from a fully played receipt.
```

Audio is completed-utterance HTTP input with native streamed PCM/captions. It is not a continuous duplex service. The output rate is an explicit 24 kHz assumption. Result text is bounded server-owned data, never a browser claim. No FACTORY credential, controller path or raw receipt belongs in this adapter.

## Smallest bridge: eyes + read-only world + canonical text

Keep Brain's existing sanitized BFF, validator, poller, constellation, selection and stale handling. Add the eyes alongside its selected cell; connect its existing cell/work/effect selectors to a small read-only presentation model. Preserve the persistent preview-data notice. Do not bring the Flujo watershed, login workflow, work-model setup or execution hook into Brain.

The first bridge can summarize **inspected canonical state in text** without a model call. A verified task can say “FACTORY reports task X as verified at revision R”; it cannot claim publication, physical worker activity or mission completion from that status alone. Render evidence hashes as evidence references; downloading private artifacts needs its own authorized resolver.

Proposed package exports for the first implementation (not shipped yet):

```ts
// @flujo-ai/avatar/eyes: existing component/types above
// @flujo-ai/avatar/factory: pure presentation component, no backend client
type FactoryAvatarObservation = {
  factoryId: string;
  revision: number;
  cursor: string;                    // opaque; never decode it
  observedAt: string;               // snapshot read time only
  readState: 'fresh' | 'stale' | 'unavailable' | 'preview';
  mission: string;
  selectedCell?: {
    id: string; purpose: string; heartbeat: string;
    reportedStatus: 'reserved' | 'ready' | 'retired';
    activityEvidence: 'idle' | 'recent' | 'uncertain';
  };
  selectedTask?: {
    id: string; attempt: number; owner: string | null;
    reportedStatus: 'ready' | 'running' | 'review' | 'verified'
      | 'delivered' | 'rejected' | 'completed' | 'cancelled';
    candidateDigest: string | null;
    reviewEvidenceDigest: string | null;
  };
  unresolvedEffects: number;
  effectsDrained: boolean;
  workerQuiescence: 'unverified';
  commands: false;
  voice: false;
};
type FactoryAvatarProps = {
  observation: FactoryAvatarObservation | null;
  avatar: AvatarStyle;
  locale: 'es' | 'pt' | 'en';
  onInspect(target: { kind: 'cell' | 'task' | 'effect'; id: string }): void;
};
```

Brain owns construction of this observation from its already validated `FactorySnapshot`; the avatar package must not become a second DTO validator, poller, controller or state authority. `onInspect` changes the current inspection selection only. No execute, retry, resume, provision, billing or artifact-fetch callback is included.

Reuse Brain's existing `factoryCellActivity`, which checks running task ownership, active admission, a ready cell, a heartbeat no older than 60 seconds, valid leases and absence of unknown owned effects. `recent` is recent evidence, not a live worker assertion. Initially keep the eyes idle for readable observations and show that evidence in text; show a disconnected/error state on unavailable data. Decorative blinking is independent of execution. Do not map `control.status: active`, `cell.status: ready` or a fresh `observedAt` to “thinking”. A stale view stops activity animation.

Apply every valid snapshot, including equal revisions because heartbeat values can change without a controller event. Reject authority changes/regressing revisions through the existing host validator. Logical allocation is not metered spend; do not sum descendant allocations. Optional paid-ledger state has its own observation/revision and is outside the first avatar display.

## Narration extension after authorization

The current FACTORY response has metadata and evidence hashes, not a work-result body or command receipt. Immediate text captions can describe that exact state. Spoken narration requires separate permission/admission for the presentation service and transmission of bounded operator metadata.

Before enabling audio, parameterize the native hook's endpoint/worklet boundary and replace the Flujo-specific prompt/result resolver. Brain's server must authenticate staff, bind the expected factory ID, resolve the requested task from its canonical authority and issue a short-lived, session-bound single-use receipt. Browser input supplies identifiers, never narration facts. Bind task attempt, candidate/spec digests, review evidence, factory epoch and observed revision; check matching review/candidate/spec/attempt before describing a review as accepted. Revocation on session/factory/locale/selection change must stop stale narration. Reconnect/failed ACK must not dispatch work or replay an unqualified result.

Do not read the private FACTORY credential in an avatar frontend, expose raw controller artifacts, forward the full snapshot to OpenRouter, or offer paid voice/commands under the existing read-only contract. The server-side read credential stays in the existing Brain BFF.

## First bounded implementation and acceptance

1. Add an explicit source/bundled packaging boundary for Eyes, its CSS, types and React 18/19 peers in this repository; preserve source hashes when vendoring instead. No npm publication is implied.
2. Add the pure read-only presentation component and ES/PT/EN captions here. Brain's owner wires it to the existing selected-cell/selected-task view in a separate Brain commit.
3. Verify React 18/Vite import, keyboard inspection, reduced motion, preview labeling, stale/unavailable behavior, equal-revision heartbeat refresh and no current-activity claim from read timestamps.
4. Keep voice/commands disabled. Review the bounded server narration contract separately when FACTORY/Brain owners provide authority and admission.

Current Flujo evidence: 33 portable tests, 65 focused backend tests, 10 frontend tests after identity coverage, and a successful production build before the final identity/layout follow-up. Browser checks passed bootstrap Spanish audio before a work AI existed, real Codex model/tool verification, Flujo tool execution, `write_resource`, artifact preview/reload, canonical-result audio without microphone access, and embedded Spanish conversation inspection. Flow/Persona identity and final layout changes are being built/tested in the isolated Flujo worktree. Human microphone quality is not claimed.

## Terminal outcome compatibility — 3 October 2026

This focused update is based on Brain's existing compiled package pin
`c2e7c4671a0e24af9879e59279f1309974c559cb`, rather than later Flujo world or voice changes.
It adds only `completed` and `cancelled` to `selectedTask.reportedStatus`.
The host DTO remains schemaVersion 1; no observation fields, commands, exports or backend connections are added.

- `completed` closes an explicitly typed operation with exact successful effect evidence. The EN/ES/PT captions identify an operation outcome and explicitly say this status does not establish software review or delivery. Host validation owns that admission; this pure renderer does not inspect private operation effects.
- `cancelled` records abandonment or unmet acceptance. The renderer retains supplied attempt/owner and candidate/review hashes; it does not clear evidence or count this outcome as accepted delivery.
- Neither terminal value establishes running work, physical activity, worker quiescence, budget release or final metered spend. Independently supplied activity evidence remains independent. Eyes remain idle for readable observations and disconnected for unavailable data; `commands: false` and `voice: false` stay unchanged.

Qualification in an isolated worktree on Windows, Node 22.13.1 / npm 11.19.0:

- `npm ci` and `npm test` passed: **44 tests**, including **11 Factory presentation tests** against the compiled `@flujo-ai/avatar/factory` export.
- New regressions exercise completed/cancelled in EN/ES/PT × fresh/stale/preview × idle/recent/uncertain evidence; verify explicit review/delivery limitations, idle eyes and unverified workers, preserve hashes, hide unavailable evidence, allow null hashes without inventing them, and render frozen cancellation props without mutation.
- `npm run example:typecheck` and `npm run example:build` passed with React 18.3.1; the isolated React 19.2.8 Vite consumer built successfully using its existing dependencies read-only.
- `npm pack --dry-run --json` passed: ten allowed package files, including compiled ESM/CSS/declarations and handoff documentation. No voice source, preview fixtures, backend, credentials or checkout is packed. Git HTTPS installation builds `dist` with the existing `prepare` script.
- The compiled runtime export allowlist remains exactly `Eyes` and `FactoryAvatar`; voice and execution modules are outside this package boundary.

This qualification covers the package reader only. Brain's owner must independently qualify its shared schema, BFF, dashboard and installed avatar at an exact public Git HTTPS pin before FACTORY writes either terminal value live. No Brain/FACTORY files, live controller state, deployment or production configuration are changed here.
