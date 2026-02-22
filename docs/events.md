# Events Reference

The Ribaunt CAPTCHA widget emits three standard DOM events (`CustomEvent`) that notify you of the lifecycle and results.

## 1. `verify`
Dispatched when the solver successfully solves all challenges and the server endpoint verifies it (if `verify-endpoint` is specified). 

If no `verify-endpoint` is specified, it just means the solver finished its local work.

**Event Type:** `CustomEvent<{ solutions: ChallengeSolution[] }>`

```javascript
widget.addEventListener('verify', (e) => {
  const { solutions } = e.detail;
  // solutions: Array of { nonce: string, hash: string }
  console.log('Successfully completed challenge!', solutions);
});
```

## 2. `error`
Dispatched when an error occurs fetching tokens, solving them, or verifying them with the server.

**Event Type:** `CustomEvent<{ error: string }>`

```javascript
widget.addEventListener('error', (e) => {
  const { error } = e.detail;
  console.error('CAPTCHA failed:', error);
});
```

## 3. `state-change`
Dispatched every time the widget moves from one visual state to another.

**Event Type:** `CustomEvent<{ state: 'initial' | 'verifying' | 'done' | 'error' }>`

```javascript
widget.addEventListener('state-change', (e) => {
  const { state } = e.detail;
  switch (state) {
    case 'initial':
      console.log('Ready to solve');
      break;
    case 'verifying':
      console.log('Solving PoW...');
      break;
    case 'done':
      console.log('Done!');
      break;
    case 'error':
      console.log('Oops! Failed.');
      break;
  }
});
```

## Listening in React
If you use the React wrapper (`ribaunt/widget-react`), you get built-in strongly-typed callback props:

```tsx
<RibauntWidget
  onVerify={(detail) => console.log('Solutions:', detail.solutions)}
  onError={(detail) => console.error('Error:', detail.error)}
  onStateChange={(detail) => console.log('State:', detail.state)}
/>
```
