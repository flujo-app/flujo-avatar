# Avatar interface build

Active goal: build the vision in VISION.md against the audited Flujo capabilities.

## Checkout

- Implementation: `flujo/`, isolated Git worktree on `codex/avatar-world`.
- Base: Flujo `d68492712315d30c856c8d2ba95b0a26a859bd18`.
- Main checkout and its staged/unstaged changes are untouched.
- Dependencies were installed with `npm ci` against this checkout's committed lockfile (Codex SDK 0.153.3). The initial shared junction was moved outside the workspace to the Windows temporary directory; its original target was untouched. Preview storage is separate.

## Required evidence before completion

- [x] Safe host discovery of Codex, Claude, saved models, and local/API options, with no credential output or passive provider calls.
- [x] Real setup and model/tool verification; workspace default for new work without overwriting authored bindings.
- [x] Black/white eyes; interactive world driven by actual Flujo state.
- [x] Bootstrap OpenRouter conversation service before a work model exists.
- [ ] Actual Flow work, steering, cancellation, approvals, resources, and reload reconciliation.
- [ ] Real embedded Flujo controls and persistent MCP Apps.
- [ ] Personas, automations, meetings, packages and advanced capability access through existing runtimes.
- [ ] Spanish/Portuguese, keyboard/text, reduced motion, and workspace isolation.
- [ ] Type checks, focused regression tests, production build, and live browser acceptance.

The goal remains active until these journeys are built and verified. A mock scene or partial prototype does not satisfy completion.

## Published foundation

Public repository: https://github.com/flujo-app/flujo-avatar. Flujo branch: `codex/avatar-world`. The initial foundation passed 47 focused tests, TypeScript, lint and a production build before rebasing onto 3.46.2. That checkpoint preceded the live subscription tests described below. Discovery, model/tool verification, state-driven eyes/world, real chat controls and persistent embedded panels are implemented.

## Native voice and real work checkpoint

- Portable eyes, microphone capture, native stream parser, bounded playback and heard-response ledger now live in this repository. Flujo receives synchronized source with SHA-256 provenance.
- 33 native adapter/playback/utterance tests passed. The Flujo bridge passed five result-integrity tests; the foundation regression suites passed on the current base. TypeScript and lint passed; a production build completed. A follow-up build covers the final link, catalog and layout fixes.
- Production browser acceptance: OpenRouter answered a Spanish setup question while the workspace had no work model. No microphone recording or human voice-quality acceptance is claimed by this test.
- Codex `gpt-6-luna` was rejected by this account; the editable setup stayed open and readiness stayed false. Codex `gpt-5.5` then passed the real transport and diagnostic-tool round trip. Its preference became ready only after success.
- The avatar's selected Codex model used actual Flujo tools to list the bundled FLUJO flow and four connected shipped apps. No configuration was changed by that read-only task.
- Added public cached Codex model hints as unverified options, resource objects/previews, canonical-result narration receipts, correct panel parameters, editor navigation guards and language synchronization. These follow-up UI changes are being browser-tested.
- A live artifact request revealed that Flujo requires a produce-role resource edge before exposing `write_resource`. New avatar quick chats now request the named `world-result` output through the existing FlowSpec compiler. Ordinary quick chats and existing conversations keep their graph unchanged. The focused current-base backend union passed 65 tests.
- Remaining: operational Flow/Persona identity selection, broader automation/meeting/package/App journeys, human microphone acceptance and final end-to-end recovery/resource checks. The goal remains active.
