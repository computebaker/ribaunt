# React Integration Guide

If you are using Vite, Create React App, or another React framework (that doesn't have SSR issues like Next.js), you can either use our provided `widget-react` wrapper or the raw web component.

## Method 1: Using the React Wrapper (Recommended)

Our React wrapper handles event binding cleanly and exposes a `ref` handle to easily reset or trigger verification.

```tsx
import React, { useRef } from 'react';
import RibauntWidget from 'ribaunt/widget-react';

export default function MyReactApp() {
  const widgetRef = useRef(null);

  const handleVerify = (detail) => {
    console.log('Verified solutions:', detail.solutions);
  };

  const handleError = (detail) => {
    console.error('Verification failed:', detail.error);
  };

  const handleStateChange = (detail) => {
    console.log('Current widget state:', detail.state);
  };

  return (
    <form>
      <RibauntWidget
        ref={widgetRef}
        challengeEndpoint="/api/captcha/challenge"
        verifyEndpoint="/api/captcha/verify"
        onVerify={handleVerify}
        onError={handleError}
        onStateChange={handleStateChange}
      />
      <button type="button" onClick={() => widgetRef.current?.startVerification()}>
        Verify Manually
      </button>
      <button type="submit">Submit Form</button>
    </form>
  );
}
```

## Method 2: Using the Raw Web Component

Since we provide TypeScript declarations for `HTMLElementTagNameMap` and `JSX.IntrinsicElements`, you can also import and use the raw web component natively in JSX.

```tsx
import React, { useEffect, useRef } from 'react';

// Side-effect import to register the web component
import 'ribaunt/widget'; 

export default function MyReactApp() {
  const widgetRef = useRef<import('ribaunt/widget').RibauntWidgetElement>(null);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    const handleVerify = (e: CustomEvent) => {
      console.log('Verified!', e.detail.solutions);
    };

    widget.addEventListener('verify', handleVerify);
    return () => widget.removeEventListener('verify', handleVerify);
  }, []);

  return (
    <form>
      {/* Type-safe custom element properties! */}
      <ribaunt-widget
        ref={widgetRef}
        challenge-endpoint="/api/captcha/challenge"
        verify-endpoint="/api/captcha/verify"
      />
      <button type="submit">Submit Form</button>
    </form>
  );
}
```

Both approaches are completely type-safe out of the box!
