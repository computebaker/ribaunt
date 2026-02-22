# Next.js Integration Guide

Integrating Ribaunt CAPTCHA into Next.js requires using our special React wrapper and SSR guards because the web component relies on browser-only APIs (`window`, `customElements`, and `Web Crypto API`).

## Step 1: Using the Next.js React Wrapper

We provide a specialized React wrapper exported via `ribaunt/widget-react` that handles dynamic imports internally, completely bypassing SSR errors.

```tsx
'use client'; // Required if using Next.js App Router

import React, { useRef } from 'react';
import RibauntWidget, { type RibauntWidgetHandle } from 'ribaunt/widget-react';

export default function MyPage() {
  const widgetRef = useRef<RibauntWidgetHandle>(null);

  const handleVerify = (detail: { solutions: any[] }) => {
    console.log('Verified solutions:', detail.solutions);
  };

  const handleError = (detail: { error: string }) => {
    console.error('Verification failed:', detail.error);
  };

  const handleStateChange = (detail: { state: string }) => {
    console.log('Current widget state:', detail.state);
  };

  return (
    <form>
      <RibauntWidget
        ref={widgetRef}
        challengeEndpoint="/api/captcha/challenge"
        verifyEndpoint="/api/captcha/verify"
        showWarning={false}
        onVerify={handleVerify}
        onError={handleError}
        onStateChange={handleStateChange}
      />
      <button type="submit" onClick={() => widgetRef.current?.startVerification()}>
        Submit
      </button>
    </form>
  );
}
```

## Step 2: Setting up Next.js Route Handlers (API Routes)

Create the necessary API endpoints in the `app/api/` directory (or `pages/api/` if using Pages Router).

### `app/api/captcha/challenge/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createChallenge } from 'ribaunt';

export async function GET() {
  // Generates 4 challenges, difficulty 5, expiring in 300 seconds
  const challenges = createChallenge(5, 4, 300);
  return NextResponse.json({ challenges });
}
```

### `app/api/captcha/verify/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { verifySolution } from 'ribaunt';

export async function POST(req: Request) {
  const body = await req.json();
  const { tokens, solutions } = body;
  
  const isValid = verifySolution(tokens, solutions);
  
  if (isValid) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false, error: 'Invalid CAPTCHA solution' }, { status: 400 });
  }
}
```

## Considerations for Next.js 

- **Always use `'use client'`**: The component needs to render in the browser.
- **Do not wrap in `next/dynamic`**: `ribaunt/widget-react` already handles dynamic importing internally, making your code cleaner.
- **Environment Variables**: Make sure your `RIBAUNT_SECRET` is defined in `.env.local` but *do not* prefix it with `NEXT_PUBLIC_` since it must stay on the server.
