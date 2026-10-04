# Codex sibling continuity world

This is a separate static adapter for O's new `codex-sibling-continuity-v1` mode. It preserves the original avatar source and six-member world artifact at `9146a64b355a6df60b3c6ae2b0a3d6be671806fe`. The new entry, parser, pending journal, preview server and artifact destination live separately.

The browser accepts only status/SSE wire version 2, exact `reviewMode: 'codex-sibling-continuity-v1'`, exact `reviewEvidence: 'same-provider-sibling-job'`, and two distinct workers with developer/reviewer roles and `providerId: 'codex'`. The public namespace must match `^o-dev-continuity-[a-z0-9-]{1,100}$`; the public workspace must equal that namespace. Auth/session envelopes keep version 1. Legacy status wire 1, missing evidence, another provider, duplicate identities or another namespace refuse before intake can become available.

The page identifies itself as Codex continuity. The work drawer labels Codex developer, Codex sibling reviewer, same provider and reviewed text with tools disabled. Accepted text is presented as “Text sibling review accepted.” No independent account, Claude review, coding execution or provider attempt count is inferred. Reported readiness and stored work never drive a claimed work animation; the eyes respond to actual voice phase and user movement.

Private worker workspace binding belongs to the server. The browser neither consumes nor forwards a `workerWorkspace`, worker origin, account, token or private model configuration. Public session/status workspace stays the fresh continuity namespace even when the coordinator reuses an existing private worker leaf. Root owns the actual new database, intent, worker binding, model qualification, source/image selection and deployment.

The pinned V6 client contract is SHA-256 `137f92d86f0e208fb9660b4b3598b8708789694cd81d9102bd82c2f674cdd10a`, under O source manifest `4ba752f085b3a05728c84126720a9bc75d1a8a98e6a0a9b62cd7ce019949a645`. Later private-binding corrections can retain this wire; a public contract change requires new qualification.

Task intake, CSRF/Origin, full-state SSE, scoped voice transport and GET reconciliation retain the established fixed paths. A separate continuity pending journal retains an unconfirmed UUID and goal across reloads and refuses automatic POST retry. A changed or malformed public session closes the old scope. Result narration remains disabled: O task IDs never become canonical Flujo conversation/message IDs, and prior-mode acceptance cannot mint a continuity narration receipt.

Build from a clean source checkout with installed dependencies:

```powershell
$env:FLUJO_SCENE_CHECKOUT = 'C:/path/to/a/Flujo/git/checkout'
node scripts/build-continuity-world.mjs
npx tsc --noEmit -p tsconfig.continuity-world.json
```

The original physical scene is extracted from Flujo `3d85f2df3070d1b92aea68732cdeda028d30e6ac`; eyes/audio source is unchanged. The output is `artifacts/continuity-world/<new-source-pin>/` plus `.tgz`, with five public members and `MANIFEST.json`. `PROVENANCE.json` records the distinct mode, wire version, source and contract hashes. O mounts a qualified artifact through `O_DEV_WORLD_DIR` and `O_DEV_WORLD_MANIFEST_SHA256` on the separately configured continuity host. This does not update the existing world or deployment.

For sample data only, build with `--development` and run `node scripts/preview-continuity-world.mjs` at `127.0.0.1:43948/world`. The sample notice remains visible; the fixture has no provider or microphone integration.

Qualification: 60 package/adapter tests, including eight continuity tests; standalone TypeScript and static build; local browser sibling labels, wire-1 refusal with disabled intake/no task cards, same-revision readiness replacement, an unconfirmed intake reconciled after reload with exactly one additional fixture HTTP POST, desktop and 390×844 layout. A changed session cleared task cards and intake; browser errors and warnings were zero. Existing mounted voice tests qualify the unchanged adapter independently. Cloud models, live voice, coding tools, phone and continuous runtime qualification remain separate.
