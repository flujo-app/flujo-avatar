# Avatar interface build

Active goal: build the vision in VISION.md against the audited Flujo capabilities.

## Checkout

- Implementation: `flujo/`, isolated Git worktree on `codex/avatar-world`.
- Base: Flujo `d68492712315d30c856c8d2ba95b0a26a859bd18`.
- Main checkout and its staged/unstaged changes are untouched.
- Dependencies were installed with `npm ci` against this checkout's committed lockfile (Codex SDK 0.153.3). The initial shared junction is preserved outside the checkout as `.dependency-reference`; do not mutate its target. Preview storage must be separate.

## Required evidence before completion

- [ ] Safe host discovery of Codex, Claude, saved models, and local options, with no credential output or passive provider calls.
- [ ] Real setup and model/tool verification; workspace default for new work without overwriting authored bindings.
- [ ] Black/white eyes; interactive world driven by actual Flujo state.
- [ ] Bootstrap OpenRouter conversation service before a work model exists.
- [ ] Actual Flow work, steering, cancellation, approvals, resources, and reload reconciliation.
- [ ] Real embedded Flujo controls and persistent MCP Apps.
- [ ] Personas, automations, meetings, packages and advanced capability access through existing runtimes.
- [ ] Spanish/Portuguese, keyboard/text, reduced motion, and workspace isolation.
- [ ] Type checks, focused regression tests, production build, and live browser acceptance.

The goal remains active until these journeys are built and verified. A mock scene or partial prototype does not satisfy completion.

## Published foundation

Public repository: https://github.com/flujo-app/flujo-avatar. Flujo branch: `codex/avatar-world`. The foundation passed 47 focused tests, TypeScript, lint and a production build before rebasing onto 3.46.2; current-base validation follows. Discovery, model/tool verification, state-driven eyes/world, real chat controls and persistent embedded panels are implemented. Native conversation and broader capability journeys remain in progress. No live subscription work test has yet passed.
