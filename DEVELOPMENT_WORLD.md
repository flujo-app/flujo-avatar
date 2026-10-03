# Mountable development world

The standalone `/world` surface reuses Flujo's physical canvas scene from source `3d85f2df3070d1b92aea68732cdeda028d30e6ac` and this repository's portable eyes and audio adapter. It is a small browser client for O's dedicated development coordinator: text intake, current status, full-state SSE and optional authenticated speech recognition. English is the interface language.

The landscape stays central. Click the terrain or use arrow keys to move the eyes. The work drawer opens on demand. Only recorded output adds scene lights; worker readiness, an entered HTTP submission and fresh heartbeats do not animate claimed execution. Current text qualification keeps tools disabled, and that limitation is visible in the drawer. This client does not replace Flujo's full setup, resource or embedded controls.

The coordinator owns root login, separate one-use browser enrollment, HttpOnly cookies, exact Origin/CSRF checks, durable tasks, worker pairing and private voice admission. The browser uses `GET /api/avatar/session`, `x-o-csrf`, fixed `/api/development/{tasks,status,events}` and `/api/avatar/remote/*`. No owner, worker or upstream bearer is accepted, stored or bundled by the world. An anonymous startup redirects to the coordinator's root login. A later session loss clears the scene, SSE and voice and offers sign-in.

SSE `event: state` replaces the current positive-projected snapshot. Equal revisions update readiness/heartbeat; a lower revision cannot replace newer state. Reconnection only reads current data. One explicit task submission gets one fresh client UUID. An unconfirmed response keeps that UUID and goal in session storage across reloads; the composer is held until GET evidence identifies the saved task. The client never explicitly retries a POST. Browser/network internals may retry transport, so the coordinator's exact-key deduplication remains necessary. Expiry or a different session discards the pending correlation. No replay cursor is used for task dispatch.

Speech is opt-in, uses complete utterance recognition and submits recognized work directly. This standalone host does not mint Flujo result narration receipts from O output; its task results remain in the work drawer. Flujo's complete integration owns canonical-result narration. Provider availability, actual remote voice, microphone hardware and model execution are separate checks.

Build from a clean source checkout with independently installed dependencies:

```powershell
npm ci
$env:FLUJO_SCENE_CHECKOUT = 'C:/path/to/a/Flujo/git/checkout'
node scripts/build-development-world.mjs
npx tsc --noEmit -p tsconfig.development-world.json
```

The builder extracts only six files from the fixed Flujo Git commit, bundles React and local CSS without external runtime imports, preserves license comments, copies the worklet, and writes public source provenance. The output is `artifacts/development-world/<avatar-commit>/` plus a `.tgz`. `MANIFEST.json` version 1 lists each member's path, bytes and SHA-256. Mount the directory as `O_DEV_WORLD_DIR` and set `O_DEV_WORLD_MANIFEST_SHA256` to the printed manifest hash. The O server verifies the manifest and every served asset; no source repository or private config belongs in this artifact. Root owns final coordinator image composition and deployment.

For a clearly labeled sample-data preview, run the builder with `--development`, then `node scripts/preview-development-world.mjs`. The fixture binds only `127.0.0.1:43947`, has no credentials or provider integration, and is never a production backend.

Qualification: 8 public-wire/intake/lifetime tests plus the existing 44 adapter/package tests; standalone TypeScript and bundled static build; browser task intake, keyboard movement, compact drawer, equal-revision readiness changes, desktop and 390×844 layout, and an unconfirmed response reconciled after reload with one fixture HTTP POST. Session expiry cleared old task cards and the composer; no browser errors or warnings appeared. Initial socket-drop fixture caused browser transport retry and lacked server deduplication; that fixture limitation is retained here and corrected to mirror exact-key deduplication. Final unknown-receipt fixture ends an unreadable success body after saving, and reconciliation uses GET. No live model or microphone was used. Reduced/hidden-motion handling is inherited from the exact pinned canvas and eyes source.
