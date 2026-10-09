# FLUJO World and its sky

`WorldSky` is a presentation camera around the existing World and Brain swarm surfaces. Scroll upward from the terrain into the sky, or use its keyboard button. Both children remain mounted: a World draft, work drawer, native audio owner and the existing swarm iframe keep their state when the camera moves. The adapter starts at the World and honors reduced motion. The sky contains host-supplied observations; ambient decoration never establishes a worker or its activity.

Each region contains its own visual layers, so a host header cannot cover the camera's controls. This preserves the existing surfaces' styling while keeping the World-to-sky button clickable.

This proposal is separate from the sealed World PR #1 at `7aad2a5f237fd8670e4b99254a250729a7fb9844`, the original `9146a64` artifact and the Factory consumer `f52e16c`. It does not update those deployments or their source pins.

```tsx
import { WorldSky } from '@flujo-ai/avatar/world-sky';
import '@flujo-ai/avatar/styles.css';

<WorldSky world={<ExistingWorld />} sky={<ExistingSwarmHost />}
  model={validatedSwarmModel} selection={validatedSelection}
  onNavigate={handlePresentationIntent} />
```

The props structurally accept the host-validated `brain-swarm/1` model. The package does not parse transport DTOs, poll, fetch, enroll sources, dispatch commands or create voice sessions. `selection` and navigation intents carry the full `{sourceId,factoryId,kind,id}` identity. A removed source/record, unavailable source or changed factory cannot be returned as a current selection. Stale retained records remain inspectable and do not become live observations. The host remains responsible for its validation, authority floors, denial clearing and data privacy.

`onNavigate({layer,selection})` is a presentation intent, never a URL or execution command. The current viewer has no parent-to-viewer select message. The existing authorized host can use its scoped initial deep link when mounting the viewer; this package does not extend its message protocol. Keep the real viewer continuously mounted and its exact same-origin/window/channel checks intact. Optional recorded flow/node inspection remains inside that viewer.

Direct Flujo navigation requires a separately authorized worker-to-tenant binding. The current swarm DTO supplies no instance URL or such capability. Use an authorized host's returned viewer/editor URL after a deliberate instance action; never derive a tenant URL from a cell, worker or machine ID. Native voice, live source admission, both-subscription workspace/MCP cloning and deployed integration are separate acceptance requirements.

Contract sources verified with the Brain owner:

- Brain Online `f9f77587bdf5d16f5cab3e86ad94e8d32c51cc3d`: `FactorySwarm.tsx`, shared Factory/swarm/observatory DTOs and authenticated Factory routes.
- Brain viewer `f2ddadedafdece096c9b42f1129f77cc5065109d`: swarm model/renderer, scoped selection and recorded flow inspection.

The local sample consumer is `examples/world-sky`. Build the package, retain the World fixture at `127.0.0.1:43948/world`, then run `npx vite examples/world-sky --host 127.0.0.1 --port 43949 --strictPort`. Its two labelled sources are sample presentation data, not cloud nodes. The World iframe is the existing local fixture; no mic or provider is started. A host-owned mounting/selection qualification accompanies this proposal independently.

Local qualification passed all 65 package tests (the five new selection/presentation checks are included), package/example types and the sample production build. Browser checks covered an unsubmitted World draft surviving sky/World travel, upward native scrolling, keyboard activation, reduced-motion positioning, both source/factory identities for equal cell IDs, replaced-authority navigation returning a null selection, unavailable observations and a 390×844 layout without horizontal overflow. Browser errors and warnings were zero; viewport and motion overrides were restored. This does not qualify live audio continuity, a deployed source or direct instance access.
