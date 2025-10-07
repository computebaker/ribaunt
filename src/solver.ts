/**
 * Browser-compatible challenge solver using Web Crypto API
 */

export interface ChallengeSolution {
  nonce: string;
  hash: string;
}

interface ChallengePayload {
  challenge: string;
  difficulty: number;
  expires: number;
}

/**
 * Decode JWT token (browser-compatible, without verification)
 */
function decodeJWT(token: string): ChallengePayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload as ChallengePayload;
  } catch {
    return null;
  }
}

/**
 * SHA-256 hash using Web Crypto API
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Solve a single challenge token (browser-compatible)
 */
export async function solveSingleChallenge(token: string): Promise<ChallengeSolution | undefined> {
  try {
    const payload = decodeJWT(token);
    if (!payload) return undefined;

    const { challenge, difficulty } = payload;
    const prefix = '0'.repeat(difficulty);

    let nonce = 0;
    while (true) {
      const hash = await sha256(`${challenge}${nonce}`);

      if (hash.startsWith(prefix)) {
        return { nonce: String(nonce), hash };
      }

      nonce++;

      // Yield to prevent blocking the UI (every 1000 iterations)
      if (nonce % 1000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  } catch (err) {
    return undefined;
  }
}

/**
 * Solve multiple challenge tokens (browser-compatible)
 */
export async function solveChallenge(
  tokens: string[],
  onProgress?: (progress: number) => void
): Promise<ChallengeSolution[]> {
  const solutions: ChallengeSolution[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) {
      throw new Error(`Invalid token at index ${i}`);
    }
    
    const solution = await solveSingleChallenge(token);
    if (!solution) {
      throw new Error(`Failed to solve challenge ${i + 1}`);
    }

    solutions.push(solution);

    // Report progress
    if (onProgress) {
      const progress = Math.round(((i + 1) / tokens.length) * 100);
      onProgress(progress);
    }
  }

  return solutions;
}
