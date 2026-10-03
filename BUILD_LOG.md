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
- [x] Actual Flow work, steering, cancellation, approvals, resources, and reload reconciliation.
- [x] Real embedded Flujo controls and persistent MCP Apps.
- [x] Personas, automations, meetings, packages and advanced capability access through existing runtimes.
- [x] Spanish/Portuguese controls, keyboard/text, reduced motion, and workspace isolation.
- [x] Type checks, focused regression tests, production build, and live browser acceptance without microphone recording.
- [ ] Human microphone trial for recognition, pacing, interruption and ES/PT speech quality.

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
- Live resource acceptance passed: Codex wrote `world-result`, the archive gained an object, the preview contained the exact saved text, reload preserved it, and OpenRouter narrated the canonical backend result without microphone access.
- Live operational identity acceptance passed using disposable entities in the isolated preview: a saved Flow answered with its own binding; a Persona's trusted dispatcher answered with its own stored memory. Persona-owned helper flows retain inspection but cannot be selected as ordinary agents. A second workspace had no work-model preference, artifacts or test identities from the first.
- The current production build and lint passed. Ten frontend tests cover identity and recovery; a separate backend snapshot test covers Persona ownership. The transcript no longer blocks map landmarks; the real embedded conversation opened in Spanish.
- A later production build and lint passed with 18 frontend tests. Live steering reached the same pending completion and was consumed without another run; cancellation persisted its cancelled classification through reload. The real embedded tool approval was rejected without execution, then another approval survived reload and resumed the requested read when accepted. The saved approval preference is forwarded in avatar requests. Delivery failures preserve the draft; accepted work failures keep the canonical conversation. Pending subscription approval survives running transcript refreshes.
- Advanced live checks: a one-round meeting with a saved Flow and a Persona completed with both contributions, through the real embedded meeting UI. A disabled scheduled execution ran once through its real Run now button and persisted its result; it stays disabled. These are disposable test entities in the isolated preview data.
- The default MCP sandbox port was occupied by another Flujo process, so this preview uses `FLUJO_MCP_APP_SANDBOX_PORT=43948`. The other process was untouched. The Apps place now exposes the existing persistent Quick Actions launcher. Its real terminal App ran a harmless command and retained the session/output while the embedded Packages surface opened. The world honors the host's dock reservations, leaving the composer usable.
- Package creation through the real embedded wizard resolved the witness Flow's model dependency, passed its secret review and built a local manifest. No registry publication occurred. Installed packages now project only name/version from the existing workspace install ledger; three snapshot tests cover ownership, bounds and partial failure. A built local manifest is not presented as an installed package.
- World ES/PT/EN labels, keyboard Escape/focus recovery and reduced-motion styles passed browser checks. A 390px check found overlapping resident/settings landmarks and an overflowing resident header. The landmarks are now separate; the header presents the active identity and retains visible language/world controls. The guide's work preference is shown only while addressing the guide; Springs remains the setup entry for other identities.
- The final production build, TypeScript and lint passed. The final 390px resident check passed; viewport and reduced-motion overrides were restored. Saved review views in the ignored `artifacts/` directory show the world, mobile identity, local package build and App session retained while the Packages panel opened.
- Guide Markdown links now use the same route/workspace boundary as the landmarks. Supported local links open the real embedded panel; ordinary new-tab gestures retain a normal Flujo URL. A real Codex reply linked to the automation controls and opened them without leaving `/world`. Twelve link regressions and the eight existing route-boundary tests passed.
- Canonical conversation projection now restores tagged and tool-based UI proposals with their originating panel scope, including hidden child tool messages. An unrelated root request cannot inherit a previous scope. Three new regressions passed within the 33-test work/setup/link union. The full repository type check includes tests; it caught and corrected a test fixture's `model:start` field (`model`, rather than `modelId`). Lint also passed. The generated HTTP inventory now includes all five avatar route files and passes the CI inventory check.
- Production browser acceptance passed for a real guide-generated highlight: it survived reload, applied to the original model form and reopened the panel so the highlighted field was visible. The same saved proposal was rejected after changing the panel to automations. No form values were changed or saved. The final production build passed; implementation commit `661dacb5` is pushed to Flujo PR #560. Review captures are `artifacts/flujo-avatar-guide-navigation.png`, `artifacts/flujo-avatar-proposal-recovery.png` and `artifacts/flujo-avatar-proposal-scope-rejection.png`. GitHub verification on this commit was started; it is not yet claimed as passed.
- Remaining: human microphone acceptance. The goal remains active; the optional `/world` route and draft PR are ready for that review. Existing embedded pages retain their own translation coverage; this does not claim every Flujo label or spoken response has been language-reviewed.

## Completion audit at `661dacb5`

- Current source preserves the independent bootstrap voice service, verified workspace work-model preference, authored Flow/Persona ownership, canonical narration receipts and the existing Flujo execution/control runtimes. Passive discovery offers both subscription paths, with Claude token entry remaining explicit. The source audit found no new execution engine or credential import.
- The world projects bounded entities from the real workspace services. Guide links and Apply reuse the trusted panel boundary; persistent Apps retain the global host. Live journey evidence above covers setup, actual work, resources, identity, recovery, advanced controls and accessibility.
- All 17 portable source files match both the synchronized Flujo copies and their recorded SHA-256 provenance. The preview listeners use the own isolated data root and the separate App sandbox port. Both Git repositories were clean at audit start.
- On the current Flujo head, GitHub passed type checking (including the API inventory), lint, Linux production build, both release-safety checks and isolated tests. The Windows build and full test job were confirmed live and remain pending at this checkpoint. Human microphone acceptance also remains pending; the goal is not complete.

## Brain / FACTORY supporting package

- Moe's direct coordination instruction was verified in the Brain owner's chat before reporting back. The durable handoff was accepted by that owner.
- Added an explicit ESM/CSS/declaration export boundary, React 18/19 peers and a pure `FactoryAvatar` with host observation/inspection props. It never polls, sends voice or dispatches work. Browser examples are always labeled sample data.
- All 37 package/native tests passed. React 18.3.1 and 19.2.8 Vite consumers built and ran without console errors. Keyboard inspection, ES/PT/EN, equal-revision heartbeat presentation, unavailable/stale states and reduced-motion CSS were checked in the browser.
- Brain and FACTORY code were read for the contract; their worktrees were not edited. Brain's owner integrates the exported package separately. Read-only observation does not authorize customer tenancy, execution commands or paid narration.
- Brain's owner subsequently accepted the package and reported integration at `0a32fbb6fb98159ec62c06c4e59f214672a03618` in [PR #34](https://github.com/flujo-app/brain-online/pull/34). That report covers the pinned package, stylesheet, host-owned polling, local inspection, three languages and a 390px browser check. This is owner-reported integration evidence, separate from the package checks performed here.
- The owner later reported authorization-loss cleanup at `b811bbd2dd8f7682e9c5598845c8f23a84badf1d`: the host clears evidence after 401/403/404 and identity changes. The pinned avatar package is unchanged. Its 28 combined checks and rebuilt Linux image are owner-reported evidence.
