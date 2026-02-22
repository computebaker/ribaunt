# Ribaunt CAPTCHA Quick Start

Welcome to Ribaunt CAPTCHA! This guide will help you set up and integrate the stateless PoW CAPTCHA library into your project.

## Installation

Install Ribaunt via your preferred package manager:

```bash
npm install ribaunt
# or
yarn add ribaunt
# or
pnpm add ribaunt
```

## 1. Set Up Environment Variables

Ribaunt uses JWT to securely sign challenge tokens. You must set a strong secret in your server environment:

```env
RIBAUNT_SECRET="your-very-strong-random-secret-key"
```

## 2. Server Implementation

You need two endpoints on your server: one to generate the challenge, and one to verify the solution.

```typescript
import express from 'express';
import { createChallenge, verifySolution } from 'ribaunt';

const app = express();
app.use(express.json());

// 1. Endpoint to get a challenge
app.get('/api/captcha/challenge', (req, res) => {
  // Generate 4 challenges with difficulty 5, valid for 300 seconds
  const challenges = createChallenge(5, 4, 300);
  res.json({ challenges });
});

// 2. Endpoint to verify the solution
app.post('/api/captcha/verify', (req, res) => {
  const { tokens, solutions } = req.body;
  
  const isValid = verifySolution(tokens, solutions);
  
  if (isValid) {
    res.json({ success: true, message: 'Verified!' });
  } else {
    res.status(400).json({ success: false, error: 'Invalid solution' });
  }
});

app.listen(3000);
```

## 3. Frontend Integration

### Using React / Next.js
If you are using React or Next.js, use our pre-built React wrapper:

```jsx
import RibauntWidget from 'ribaunt/widget-react';

export default function MyForm() {
  return (
    <form>
      {/* Other form fields */}
      <RibauntWidget 
        challengeEndpoint="/api/captcha/challenge"
        verifyEndpoint="/api/captcha/verify"
        onVerify={() => console.log('User verified!')}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Using Plain HTML
Include the widget in your HTML file directly:

```html
<script type="module" src="node_modules/ribaunt/dist/widget-browser.js"></script>

<ribaunt-widget 
  challenge-endpoint="/api/captcha/challenge"
  verify-endpoint="/api/captcha/verify"
></ribaunt-widget>

<script>
  const widget = document.querySelector('ribaunt-widget');
  widget.addEventListener('verify', (e) => {
    console.log('Verified!', e.detail.solutions);
  });
</script>
```

## What's Next?
- [Framework Integrations](./integrations/)
- [Server Examples](./server/)
- [Configuration Options](./configuration.md)
- [Theming & Styling](./theming.md)
