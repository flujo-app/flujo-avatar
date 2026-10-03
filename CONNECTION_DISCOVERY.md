# First-run connection discovery

2 October 2026 · proposed generic Flujo capability

Implementation status: passive discovery and verified workspace work-model selection now exist in [Flujo PR #560](https://github.com/mario-andreschak/FLUJO/pull/560), through `/api/avatar/connections` and `/api/avatar/work-model`. The schema below preserves the original design proposal; see the [implementation types](https://github.com/mario-andreschak/FLUJO/blob/661dacb57e3c63833fc87fc70239eb8ebce64481/src/shared/types/avatar.ts) and [recorded acceptance](BUILD_LOG.md) for the current integration.

The eyes can talk before Flujo has a configured model because our OpenRouter conversation service is available immediately. The first task is to discover the user's existing thinking/work options, especially Codex and Claude subscriptions. Native voice support is never a requirement for a work connection.

## What the user experiences

“Hi. I’ll check which AI you can use here.” English is the default; Spanish and Portuguese remain selectable. A short inspection runs on **the machine hosting Flujo**, while the eyes stay attentive. The scene presents a few useful choices rather than a provider questionnaire.

Examples, contingent on actual detection:

- **Use your Codex connection** — compatible login detected; a brief Flujo test remains.
- **Connect your Claude subscription** — runtime available; complete the token connection that Flujo currently requires.
- **Use a local model** — Ollama reachable, with installed models listed.
- **Connect another AI** — existing guided API/gateway/manual setup.

If both subscriptions are usable, offer both without silently choosing. If detection is inconclusive, say so and preserve the manual path. A detected app or credential file does not establish an active subscription, remaining quota, or access to a particular model.

After the user chooses an option, test that exact candidate through Flujo. The initial test uses provider allowance. A verified connection becomes the default choice for new work initiated through the avatar. Existing workflows retain explicit bindings, and advanced multi-model composition remains available.

## Candidate model

Keep detection facts separate from verification and present a useful next action:

```ts
// Proposed projection, not an existing Flujo API.
type ConnectionCandidate = {
  id: string;
  kind: 'codex-subscription' | 'claude-subscription' | 'ollama' | 'saved-model';
  host: 'flujo-server';
  runtime: 'available' | 'missing' | 'unknown';
  authentication:
    | 'configured'
    | 'login-detected'
    | 'needs-connection'
    | 'incompatible'
    | 'unknown';
  verification: 'untested' | 'passed' | 'failed' | 'stale';
  nextAction: 'use-and-test' | 'sign-in' | 'connect-token' | 'install' | 'repair' | 'manual';
  modelChoices?: { id: string; label: string; source: 'saved' | 'provider' | 'fallback' }[];
  reasonCode?: string;
};
```

Do not include tokens, raw auth/config contents, credential-store dumps, account email, or personal project settings. A future discovery endpoint should expose this bounded projection with the same local/workspace exposure discipline as existing setup routes. Its exact name and schema are implementation choices.

## Codex path

1. Inspect saved Flujo Codex connections first. Treat a saved model as configured but untested/stale until appropriately verified.
2. Resolve the runtime used by Flujo's Codex SDK. The separately installed CLI may be useful for sign-in, but checking only PATH could incorrectly report “missing” when the SDK has its own executable.
3. Inspect only supported authentication metadata server-side. Reuse/refactor current authoritative auth-source logic without invoking mutating runtime preparation during discovery.
4. Respect `CODEX_HOME`, host-backed versus workspace-owned auth, explicit logout, and the current file-storage constraint. A leftover `auth.json` is not authoritative when the active store is keyring/auto. Offer an honest compatibility/repair path.
5. Present available model choices from compatible, account-aware discovery if supported. Current profile/wizard lists are fallback suggestions, not proof of entitlement. The experimental model-cache override is not a general discovery API.
6. On selection, save a `codex-cli` connection with subscription semantics and test through the existing model route. Current runtime code removes API-key environment fallbacks for subscription execution; preserve that separation.

The service cannot infer Flujo usability merely because the user is signed into the Codex desktop chat. It needs readiness in Flujo’s actual execution environment.

## Claude path

1. Inspect saved `claude-cli` connections and whether they have a credential reference; return only a safe configured/not-configured fact.
2. Resolve the Agent SDK execution runtime independently of the CLI used for interactive login/token setup.
3. Report a host Claude installation as a candidate, not a ready Flujo connection. Current Flujo intentionally isolates Claude runtime homes and passes the saved `CLAUDE_CODE_OAUTH_TOKEN`; it does not import personal Claude credentials/settings.
4. Reuse the current `claude setup-token` workflow in a real setup surface. The token belongs in Flujo's credential handling, never speech/transcript. Automatic reuse of a host Claude login would require a separately verified auth integration; do not claim it already exists.
5. Show current runtime-supported model choices, with clearly labeled alias/fallback options when discovery is unavailable. Verify the selected model and tool round-trip through the existing test.

## Other paths and empty results

- **Ollama:** reuse `/api/local-models/capability`; offer installed models and an explicit download path when necessary. Container/network addresses must refer to the Flujo host environment.
- **Saved API models:** offer existing sanitized configurations first, then provider discovery and current guided/manual setup. Do not harvest unrelated environment secrets into new connections.
- **Nothing detected:** offer subscription sign-in/setup, local inference, and API/gateway options. Continue guidance through our voice service.
- **Remote/container Flujo:** clearly state that inspection occurs there. A subscription logged into the user's laptop may need a connection in the hosting environment; no silent laptop credential copying.
- **Quota/provider failure:** keep the saved configuration and offer retry when appropriate or a deliberate alternate selection. Do not silently change billing mode or claim entitlement from a cached login.

## Detection vs execution

Discovery is bounded and passive: short deadlines, coalesced requests, and secret-free results. It must not install tools, log in, copy/refresh credentials, spawn agent work, generate media, pull a model, or consume inference allowance simply because the opening appeared.

The selected connection is then verified using `POST /api/model/test`. In the inspected source, this already verifies transport and a real diagnostic tool-result loop. Reuse that implementation and safe diagnostics rather than creating a second verifier. Agent readiness is a separate check: a working saved connection does not bind an existing flow automatically.

A narrow shell setup step can bind the chosen model to an unbound bundled FLUJO agent after validating the saved graph; authored bindings and user changes win. Use the existing quick-chat/model-agent paths when their explicit contracts better fit the desired conversation. Record the choice per workspace for future avatar-created work rather than overriding every existing model/flow.

## Cases to prove during implementation

| Case | Expected behavior |
| --- | --- |
| Codex SDK runtime available, no global CLI | Offer subscription connection; give sign-in instructions if needed |
| Host Codex file login detected | Offer use-and-test; show readiness only after verification |
| Codex keyring/auto plus stale auth file | Explain current compatibility limit; do not claim ready |
| Workspace-owned Codex worker login | Inspect that source; do not replace it with host login |
| Claude installed and logged in, no saved Flujo token | Offer connection setup, not automatic readiness |
| Saved Claude credential with revoked access | Verification fails clearly; retain editable connection |
| Both subscriptions usable | Present both and let the user choose |
| No native audio work model | Voice still works through our service |
| Ollama reachable with installed models | Offer actual installed choices |
| Saved model with unsupported/failed tools | Preserve configured state; do not claim agent-ready |
| Server OS differs from browser OS | Use server runtime facts |
| Existing agent already has authored model | Preserve it unless the user requests replacement |
| Public/remote deployment | Preserve exposure/auth boundaries and identify the host |

Detailed baseline source evidence is in [the capability audit](FLUJO_CAPABILITIES.md). Subsequent implementation verified a real Codex model/tool path and failed-model recovery in the isolated preview. Claude remains an explicit token-connection choice using Flujo's existing adapter; no automatic import of personal Claude credentials was added. Current evidence and remaining acceptance are recorded in [the build log](BUILD_LOG.md).
