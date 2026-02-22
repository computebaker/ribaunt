# Server Integration: Next.js API Routes

If you are using Next.js, handling challenge generation and verification via Next.js Route Handlers (App Router) or API Routes (Pages Router) is straightforward.

## 1. Environment Variable Setup

In your `.env.local` file, define the `RIBAUNT_SECRET`.

```env
# Server-side ONLY! Do NOT prefix with NEXT_PUBLIC_
RIBAUNT_SECRET="your_very_strong_random_secret_string_here"
```

## 2. App Router (Next.js 13+)

If you are using the modern `app/` directory, create the following route handlers:

### `app/api/captcha/challenge/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createChallenge } from 'ribaunt';

export async function GET() {
  try {
    // Generate 4 challenges with difficulty 5, valid for 60 seconds
    const challenges = createChallenge(5, 4, 60);
    return NextResponse.json({ challenges });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
```

### `app/api/captcha/verify/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { verifySolution } from 'ribaunt';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tokens, solutions } = body;
    
    // Validate required fields
    if (!tokens || !solutions) {
      return NextResponse.json(
        { success: false, error: 'Missing tokens or solutions' },
        { status: 400 }
      );
    }
    
    // Verify the PoW solution against the original tokens
    const isValid = verifySolution(tokens, solutions);
    
    if (isValid) {
      // You might also set a secure HTTP-only cookie here to track verification
      return NextResponse.json({ success: true, message: 'Verification successful' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired CAPTCHA solution' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 3. Pages Router (Next.js 12 and below)

If you are using the traditional `pages/api/` directory:

### `pages/api/captcha/challenge.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { createChallenge } from 'ribaunt';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const challenges = createChallenge(5, 4, 60);
    res.status(200).json({ challenges });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
}
```

### `pages/api/captcha/verify.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySolution } from 'ribaunt';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { tokens, solutions } = req.body;
    
    if (!tokens || !solutions) {
      return res.status(400).json({ success: false, error: 'Missing tokens or solutions' });
    }
    
    const isValid = verifySolution(tokens, solutions);
    
    if (isValid) {
      res.status(200).json({ success: true, message: 'Verification successful' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid or expired CAPTCHA solution' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
```
