# Configuration & Options

Ribaunt CAPTCHA has a number of configuration options to fine-tune the user experience and solver difficulty.

## Server-Side: `createChallenge`

The main function on the server side dictates how long the challenge takes to solve.

```typescript
import { createChallenge } from 'ribaunt';

// Signature
// createChallenge(difficulty: number, amount: number, ttlSeconds: number): string[]
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `difficulty` | `number` | `5` | The number of leading zeros required in the SHA-256 hash. Higher values exponentially increase solve time. Values `> 6` may cause browsers to hang. |
| `amount` | `number` | `4` | Number of individual PoW challenges generated at once. Distributes solving workload but requires more network bandwidth. |
| `ttlSeconds` | `number` | `30` | Expiration time of the JWT token. Rejects solutions submitted after this threshold. |

### Validation Rules

`createChallenge()` now validates its numeric inputs at runtime.

- `difficulty` must be a finite number and at least `1`
- `amount` must be a finite number and at least `1`
- `ttlSeconds` must be a finite number and at least `1`
- fractional values are rounded down with `Math.floor()`

### Recommended Settings
- **Fast / Background:** `createChallenge(4, 4, 30)` - takes milliseconds
- **Moderate / Form Submission:** `createChallenge(5, 4, 60)` - takes ~1 second
- **High / Sensitive Actions:** `createChallenge(5, 8, 120)` - takes ~2 seconds

> **Warning:** Do not let users control `difficulty`, `amount`, or `ttlSeconds` without validation.

## Server-Side: `verifySolution` (async)

`verifySolution()` is asynchronous and supports optional replay-prevention modes.

```typescript
import { verifySolution } from 'ribaunt';

// Signature
// verifySolution(tokens, nonceOrSolutions, options?): Promise<boolean>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `replayPrevention` | `'disabled' \| 'local' \| 'remote'` | `'disabled'` | `disabled` keeps backward-compatible behavior, `local` uses in-process memory, `remote` uses your custom store adapter. |
| `replayStore` | `{ consume(jti, expiresAt): Promise<boolean> }` | `undefined` | Required when `replayPrevention` is `remote`. Should perform atomic consume semantics (for example Redis `SET NX EX`). |
| `debug` | `boolean` | environment-based | Enables verification warnings for malformed/invalid submissions. |

### Replay Modes

- `disabled`: no replay checks; repeated valid submissions can still pass during token TTL.
- `local`: replay checks are process-local (good for single-instance deployments).
- `remote`: replay checks use your distributed store (recommended for serverless/multi-instance setups).

```typescript
const isValid = await verifySolution(tokens, solutions, {
  replayPrevention: 'remote',
  replayStore: {
    consume: async (jti, expiresAt) => {
      // Implement this with Redis/Valkey using an atomic "set if not exists" + expiry.
      return true;
    },
  },
});
```

## Client-Side: `RibauntWidget` Attributes

The `<ribaunt-widget>` web component exposes several standard HTML attributes. When using the React wrapper (`ribaunt/widget-react`), map these as camelCase props (`showWarning`).

## Browser Requirements

The browser solver depends on the Web Crypto API. That means client-side solving should be run in a secure context:

- `https://...`
- `http://localhost`

Plain LAN URLs such as `http://192.168.x.x` may not expose `crypto.subtle`, especially on mobile browsers.

| Attribute | React Prop | Type | Default | Description |
|---|---|---|---|---|
| `challenge-endpoint` | `challengeEndpoint` | `string` | `undefined` | URL endpoint that returns the JWT tokens. If undefined, the widget cannot auto-fetch. |
| `verify-endpoint` | `verifyEndpoint` | `string` | `undefined` | URL endpoint to POST the solutions. If undefined, you must handle verification manually using the solver directly. |
| `show-warning` | `showWarning` | `boolean\|string` | `false` | Shows a red warning banner above the widget. Often used to alert users if WebAssembly is missing for future fast-solvers. |
| `warning-message` | `warningMessage` | `string` | `"Enable WASM..."` | Custom message text for the warning banner. |
| `solve-timeout` | `solveTimeout` | `number\|string` | `undefined` | Optional timeout in milliseconds for solving. If omitted, solving is not automatically timed out. |
| `disabled` | `disabled` | `boolean\|string` | `false` | Disables user interaction and programmatic verification while set. |

### Disabled Behavior

When `disabled` is present and not equal to `"false"`:

- click interaction is blocked
- keyboard activation is blocked
- `startVerification()` does nothing
- the widget is removed from tab order
- `aria-disabled="true"` is applied for accessibility

### Example

```html
<ribaunt-widget
  challenge-endpoint="https://api.myapp.com/challenge"
  verify-endpoint="https://api.myapp.com/verify"
  show-warning="true"
  warning-message="WASM is disabled; this may take 3x longer!"
  solve-timeout="15000"
  disabled="false"
></ribaunt-widget>
```

## React: `RibauntWidget` Props and Callbacks

When using the React wrapper (`ribaunt/widget-react`), all HTML attributes above are available as camelCase props. Additionally, you can use typed callback props:

| Prop | Type | Description |
|---|---|---|
| `challengeEndpoint` | `string` | (HTML: `challenge-endpoint`) |
| `verifyEndpoint` | `string` | (HTML: `verify-endpoint`) |
| `showWarning` | `boolean\|string` | (HTML: `show-warning`) |
| `warningMessage` | `string` | (HTML: `warning-message`) |
| `solveTimeout` | `number\|string` | (HTML: `solve-timeout`) |
| `disabled` | `boolean\|string` | (HTML: `disabled`) |
| `onVerify` | `(detail) => void` | Fired when verification succeeds |
| `onError` | `(detail) => void` | Fired when an error occurs |
| `onStateChange` | `(detail) => void` | Fired when state changes |
| `onReady` | `(detail) => void` | Fired once after widget mounts (React-only) |
| `onLoad` | `(detail) => void` | Alias for onReady (React-only) |
| `onEvent` | `(type, detail) => void` | Catch-all for all event types |
| `ref` | `React.Ref<RibauntWidgetHandle>` | Imperative handle for `reset()`, `getState()`, `startVerification()` |
