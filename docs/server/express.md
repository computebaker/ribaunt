# Server Integration: Express

If you are using Node.js and Express, implementing the challenge generation and verification endpoints is very easy. 

## 1. Required Packages
Ensure you have `express` and `ribaunt` installed:

```bash
npm install express ribaunt
```

## 2. Server Implementation

```typescript
import express from 'express';
import { createChallenge, verifySolution } from 'ribaunt';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Set your strong secret in the environment
// e.g. export RIBAUNT_SECRET="your_very_strong_random_secret_string"
if (!process.env.RIBAUNT_SECRET) {
  console.warn('WARNING: RIBAUNT_SECRET environment variable is not set!');
}

// 1. Endpoint to generate a challenge
app.get('/api/captcha/challenge', (req, res) => {
  try {
    // Generate 4 challenges with difficulty 5, valid for 120 seconds
    const challenges = createChallenge(5, 4, 120);
    res.json({ challenges });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
});

// 2. Endpoint to verify the solution
app.post('/api/captcha/verify', (req, res) => {
  try {
    const { tokens, solutions } = req.body;
    
    // Basic validation
    if (!tokens || !solutions) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing tokens or solutions' 
      });
    }
    
    // Verify the PoW solution against the original tokens
    const isValid = verifySolution(tokens, solutions);
    
    if (isValid) {
      // You can implement custom logic here like tracking the IP or setting a session token
      return res.json({ 
        success: true, 
        message: 'Verification successful' 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired CAPTCHA solution' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

## 3. Best Practices
- **Rate Limiting:** Implement IP-based rate limiting on the `/api/captcha/challenge` endpoint using tools like `express-rate-limit` to prevent abuse.
- **Session Linking:** Instead of simply returning `{ success: true }`, you can return a signed JWT (or set an HTTP-only cookie) that the client must include on subsequent form submissions. This guarantees the form is submitted by a user who recently solved a CAPTCHA.
