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

### Recommended Settings
- **Fast / Background:** `createChallenge(4, 4, 30)` - takes milliseconds
- **Moderate / Form Submission:** `createChallenge(5, 4, 60)` - takes ~1 second
- **High / Sensitive Actions:** `createChallenge(5, 8, 120)` - takes ~2 seconds

> **Warning:** Do not let users control the `difficulty` parameter without sanitizing it!

## Client-Side: `RibauntWidget` Attributes

The `<ribaunt-widget>` web component exposes several standard HTML attributes. When using the React wrapper (`ribaunt/widget-react`), map these as camelCase props (`showWarning`).

| Attribute | React Prop | Type | Default | Description |
|---|---|---|---|---|
| `challenge-endpoint` | `challengeEndpoint` | `string` | `undefined` | URL endpoint that returns the JWT tokens. If undefined, the widget cannot auto-fetch. |
| `verify-endpoint` | `verifyEndpoint` | `string` | `undefined` | URL endpoint to POST the solutions. If undefined, you must handle verification manually using the solver directly. |
| `show-warning` | `showWarning` | `boolean\|string` | `false` | Shows a red warning banner above the widget. Often used to alert users if WebAssembly is missing for future fast-solvers. |
| `warning-message` | `warningMessage` | `string` | `"Enable WASM..."` | Custom message text for the warning banner. |
| `disabled` | `disabled` | `boolean\|string` | `false` | Disables clicking the widget. |

### Example

```html
<ribaunt-widget
  challenge-endpoint="https://api.myapp.com/challenge"
  verify-endpoint="https://api.myapp.com/verify"
  show-warning="true"
  warning-message="WASM is disabled; this may take 3x longer!"
  disabled="false"
></ribaunt-widget>
```
