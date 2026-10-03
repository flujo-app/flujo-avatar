# Avatar → brain-online handoff

2 October 2026. Moe's direct instruction to coordinate this chat as a subworker was verified in the Brain chat `01a0fed9-5f1a-70c1-a9da-b7354bfe89d2`. Brain owns integration and its repository; FACTORY owns execution. This workstream owns reusable avatar presentation and the Flujo integration. Neither owner's worktree was edited.

## Audited sources and identities

| Workstream | Source / revision | Review |
| --- | --- | --- |
| Portable avatar | [flujo-app/flujo-avatar](https://github.com/flujo-app/flujo-avatar), `c2e7c4671a0e24af9879e59279f1309974c559cb` | Public main; compiled read-only presentation package plus repository-native audio source |
| Flujo host integration | [mario-andreschak/FLUJO](https://github.com/mario-andreschak/FLUJO), `5ff09da6`, `codex/avatar-world` | [Draft PR #560](https://github.com/mario-andreschak/FLUJO/pull/560) |
| Brain host | [flujo-app/brain-online](https://github.com/flujo-app/brain-online), `9cbc8f961e86ab8301ecdb40869325ff9ec7107f` | [PR #34](https://github.com/flujo-app/brain-online/pull/34) |
| FACTORY | Local checkout `C:/Users/Moe/Documents/ChatGPT/FACTORY`, HEAD `8d8e58f7fae96bc2eec05cbc3685368e1228acfe` | No `origin` remote is configured; running presentation build has a separate identity |

Contracts read: FACTORY's `BRAIN_ONLINE_INTEGRATION.md`; Brain's `docs/FACTORY_INTEGRATION.md`; Brain's `packages/shared/src/factory.ts` and `apps/dashboard/src/pages/Factory.tsx`. The contract is staff-only, one local authority, read-only, `commands: false`. Customer tenancy, command admission and paid voice are outside this first bridge.

## What is reusable now

The initial audit at `34fd967` found source-file exports without npm exports, compiled distribution or peers. The delivered checkpoint below closes that presentation-package gap. Native voice remains repository source, with no exported FACTORY host resolver or public registry release.

```ts
// src/client/Eyes.tsx: default React component
type AvatarStyle = 'moss' | 'orbit' | 'spark';
type EyePhase = 'idle' | 'listening' | 'thinking' | 'speaking'
  | 'usingApp' | 'waiting' | 'error';
type EyesProps = { phase: EyePhase; avatar: AvatarStyle; small?: boolean };
// Also requires the sibling eyes.module.css.
```

The eyes use React hooks available in React 18 and 19, CSS modules and pointer events. They have no Flujo state or API dependency. CSS disables gaze/animation under reduced motion. The host supplies accessible status text because the eyes are decorative (`aria-hidden`). React 18/19 Vite acceptance passed at the delivered checkpoint.

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

The reviewed interface below is now implemented in the compiled package:

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
      | 'delivered' | 'rejected';
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

Flujo evidence at the first handoff: 33 native tests, 65 focused backend tests plus the ownership snapshot regression, 10 frontend tests, lint and the final production build. Browser checks passed bootstrap Spanish audio, real Codex verification/work, `write_resource`, artifact preview/reload, canonical-result audio, and embedded Spanish conversation inspection. A saved Flow answered through its binding; a Persona returned the exact fact stored in its memory. A second workspace contained none of those entities, artifacts or work preference. Persona-owned helper flows retain inspection but do not expose a direct Talk action. Human microphone quality is not claimed. Later Flujo evidence is recorded in BUILD_LOG.md.

## Delivered package and runnable consumer

Implementation commit: **`c2e7c4671a0e24af9879e59279f1309974c559cb`**. Compiled entry points: `@flujo-ai/avatar`, `@flujo-ai/avatar/eyes`, `@flujo-ai/avatar/factory` (named exports), and `@flujo-ai/avatar/styles.css` (explicit side-effect CSS import with its own declaration). ESM and TypeScript declarations are built into `dist`; React is external with peer range `^18.3.1 || ^19.0.0`. No native voice module is pulled into this presentation entry. The package remains private to npm; installation can use the pinned public Git source:

```sh
npm install git+https://github.com/flujo-app/flujo-avatar.git#c2e7c4671a0e24af9879e59279f1309974c559cb
```

Git installation builds the distribution with `prepare`. The pack dry-run confirmed ESM, CSS and declarations, without preview data, credentials, node_modules or Flujo's checkout. In the React host:

```tsx
import { FactoryAvatar, type FactoryAvatarProps } from '@flujo-ai/avatar/factory';
import '@flujo-ai/avatar/styles.css';

export function FactoryCompanion(props: Pick<FactoryAvatarProps, 'observation' | 'onInspect'>) {
  return <FactoryAvatar {...props} avatar="moss" locale="es" />;
}
```

Pass the already validated host observation and existing inspection handler. The component renders canonical text directly, updates from new props even at equal revisions, hides old evidence on unavailable observations and never acquires a backend connection. It does not infer a working/thinking phase from a read time, task status or cell readiness. Stale/unavailable views stop animation; reduced motion removes animation and gaze transforms. Task/cell inspection buttons are native keyboard controls.

Runnable source example: `examples/factory/main.tsx`. From this repository:

```sh
npm ci
npm test
npm run example:typecheck
npm run example:build
npm run example
```

Open `http://127.0.0.1:43946/`. The example self-imports the real package exports and keeps a sample-data notice in every mode. An installed React 19 project can be used without changing its dependencies:

```sh
node scripts/check-react19.mjs <installed-react19-project> --serve
```

That creates an ignored production consumer and serves it at `http://127.0.0.1:43947/`. In this workspace the React 19 source was the isolated Flujo checkout; its dependency files were only read. Both React 18.3.1 and 19.2.8 Vite consumers built and rendered successfully, with keyboard inspection and no console errors. Browser verification also covered ES/PT/EN, persistent fixture labeling, equal-revision heartbeat replacement, stale/unavailable states and emulated reduced motion (restored after testing). All **37** package/native tests, package declarations, example typecheck and consumer build passed.

This bounded subworker delivery is ready for Brain's owner to integrate. Brain/FACTORY files were not modified, no factory credentials were accessed, no voice request or work command was added, and their existing BFF/validation/activity authority remains with those owners.

## Owner acceptance

Brain's owner accepted the delivery and reported integration at `0a32fbb6fb98159ec62c06c4e59f214672a03618` in [Brain PR #34](https://github.com/flujo-app/brain-online/pull/34). The host retains its polling and validation, maps local inspection into its existing evidence surface, and imports the package and stylesheet at the pinned implementation commit above. The owner reported its Windows/Linux checks, successful Linux build and 390px browser inspection. This is the owner's integration evidence; Brain and FACTORY remain separately owned.

The owner subsequently reported host authorization-loss cleanup at `b811bbd2dd8f7682e9c5598845c8f23a84badf1d` in the same PR: snapshots/selection clear after 401/403/404, identity changes reset the view, and late profile/read results are rejected. The package/interface above remain unchanged. The owner reported nine mounted transition regressions and 28 combined checks in the rebuilt Linux image; those checks were not performed in this workspace.

## Qualified terminal-status compatibility pin — 3 October 2026

Brain requested additive support for `completed` and `cancelled` while FACTORY qualifies terminal task closure. The focused implementation is **[`f52e16cfcdb98e374b2210a0e7e6efe4031d13a5`](https://github.com/flujo-app/flujo-avatar/commit/f52e16cfcdb98e374b2210a0e7e6efe4031d13a5)**, whose immediate parent is the existing compiled pin `c2e7c4671a0e24af9879e59279f1309974c559cb`. It lives on `codex/factory-terminal-status`. Its diff contains only the Factory presentation component, its tests and the package handoff document; later Flujo world, eyes and voice changes are outside that pin. The source main branch has not adopted this compatibility change.

`npm install git+https://github.com/flujo-app/flujo-avatar.git#f52e16cfcdb98e374b2210a0e7e6efe4031d13a5`

The only contract addition is two `selectedTask.reportedStatus` values, under the host's unchanged schemaVersion 1:

- `completed`: an explicitly typed operation closed with exact successful effect evidence. EN/ES/PT canonical captions identify operation completion and explicitly say this status does not establish software review or delivery. The host owns validation of the operation/effect admission.
- `cancelled`: abandoned work or unmet acceptance. Captions distinguish that outcome, and supplied attempt/owner, candidate and review hashes remain unchanged. Null evidence stays absent.
- Neither value implies running work, worker activity, verified/delivered software, physical quiescence, budget release or final metered spend. Independently supplied activity evidence remains independent; readable eyes stay idle and unavailable eyes stay disconnected. Observation fields, inspect-only callback, runtime exports, `commands: false` and `voice: false` remain unchanged.

Qualification was performed in an isolated Windows worktree with Node 22.13.1 / npm 11.19.0:

- All **44 source-package tests** passed, including **11 Factory tests** against the compiled Factory export. New regressions cover both statuses in EN/ES/PT, fresh/stale/preview data and all three activity-evidence values; explicit review/delivery limitations; hash retention; unavailable-data hiding; null evidence; frozen cancellation props; and the unchanged export allowlist.
- Source example types/build passed with React 18.3.1, as did the React 19.2.8 source consumer.
- A clean consumer installed the exact public Git HTTPS pin. Its **11 Factory tests**, strict TypeScript fixture (all six old and two new statuses accepted; generic `complete` rejected), React 18.3.1 Vite production build and React 19.2.8 Vite production build passed.
- npm initially serialized the requested HTTPS dependency as Git SSH in the consumer lockfile. The lock's resolved URL was restored to the explicit `git+https` pin; `npm ci` passed and retained that HTTPS lock. The installed ESM, CSS and Factory declarations matched the source-built files byte for byte after reinstallation.
- Package dry-run included only ten allowed files: compiled ESM/CSS/declarations, package metadata and documentation; it packed no voice source, fixture, credentials or backend checkout. Git installation uses the existing `prepare` compilation; `dist` is not tracked or published to npm.

Compiled SHA-256 values at the exact pin:

| Artifact | SHA-256 |
| --- | --- |
| dist/index.js | 57986651146797e206f4fffcb7d5d6b568c4c1facc765d93abef97dc00a0b7cb |
| dist/index.css | 5fb6bb0140180a70988f96368e1327283b6ad5725d61100f9eb621bcb7a38643 |
| dist/factory/FactoryAvatar.d.ts | b379d5dea57c94ad53b752542f51920c2fb36a4ccf4fdf0d218f9194012976e6 |

The local machine-readable record is `artifacts/factory-terminal-qualification.json` (ignored review evidence). Package checks here do not qualify the live host. No Brain/FACTORY files, controller state, deployment or production configuration were modified.

### Brain owner acceptance of the terminal-status pin

Brain's owner accepted and adopted `f52e16cfcdb98e374b2210a0e7e6efe4031d13a5` at exact Brain source `8205fbcad467bdb27d952d30e4ae3e5ca11f02aa`, pushed on `codex/factory-visuals` in [PR #34](https://github.com/flujo-app/brain-online/pull/34). The owner independently checked the direct `c2e7c4` parent, three-file diff, runtime export allowlist and explicit HTTPS installation.

The owner reported **41 combined checks passing on Windows and the unmodified final Linux Docker build**, including the installed avatar projection/captions in EN/ES/PT and mounted operator behavior retaining history without inflating active work or delivered software. Type checks and the dashboard production build passed. Installed avatar ESM/CSS/Factory declarations matched byte for byte across Windows/Linux, with matching shared contract and BFF runtime.

The browser initially retained stale Vite optimization from the old package despite installation and type-check success. Restarting only the owner's preview with `--force` cleared it. The new operation/cancellation captions then rendered correctly in all three languages, with retained candidate/review hashes and no overflow at 390px. No package change was needed.

These are independently reported host checks by Brain's owner, not checks performed in this workspace. The owner sent the evidence to FACTORY and kept controlled-fixture qualification separate from the existing-state API witness. Replacement API and other reader qualification remain FACTORY's live-adoption gates. No merge, deployment or provider commands were performed in that handoff.
