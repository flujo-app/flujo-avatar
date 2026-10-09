# Canonical World presentation package

`@flujo-ai/avatar/world` exports the unchanged canonical `WorldScene`, frozen `WorldSky` camera and `Eyes`, with their props, phase, snapshot and selection types. Import `@flujo-ai/avatar/world.css` explicitly. React 18/19 remains a peer dependency. The World bundle imports no backend, voice hook or Factory component.

The six canonical files under `src/world/canonical` are exact Git blobs from FLUJO commit `3d85f2df3070d1b92aea68732cdeda028d30e6ac`. Their tracked manifest records original paths, byte lengths and SHA-256 hashes; every package build verifies that closure. WorldSky and Eyes retain Avatar commit `0797af8ca160c11381818f5b8cf073f50fc0046b` source bytes. Build aliases resolve locally, and only emitted declaration aliases are rewritten to package-relative paths. Normal builds and installed consumers require no external FLUJO checkout.

Production currently uses Avatar `f52e16cfcdb98e374b2210a0e7e6efe4031d13a5`. Keep that dependency locked: replacing it wholesale with this branch would change Factory terminal captions/types and Eyes. Install the candidate separately under a dependency alias (for example `@o/world-presentation`) and use its `/world` and `/world.css` exports for the World presentation imports. The candidate's root/Factory exports are not the production adoption path. Alternatively, a later integration can append the World bundle to the production package while preserving its existing Factory and Eyes files, then qualify that exact integration.

```tsx
import { WorldScene, WorldSky, Eyes } from '@o/world-presentation/world';
import type { WorldSceneProps, WorldSkyProps, EyePhase } from '@o/world-presentation/world';
import '@o/world-presentation/world.css';
```

The host owns layout, authorized observations and all interactions. `WorldScene` needs a positioned parent with explicit dimensions; it is a decorative canvas and does not include the eyes. Supply `snapshot: null` until an authorized Flujo snapshot exists. Factory leases or swarm status never establish work-model readiness or automation activity. The sample host currently uses a null terrain snapshot.

This package performs no polling, model invocation, navigation, voice or execution. Modern Canvas 2D, ResizeObserver and media-query listeners retain their existing behavior. Reduced motion and document visibility pause animation; merely moving the camera off screen does not pause the canonical renderer. This candidate preserves that behavior for Claude's later UI work.
