import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const secret: string = process.env.RIBAUNT_SECRET!;

if (!secret) {
  throw new Error('RIBAUNT_SECRET environment variable is not set!');
}

interface ChallengeTokenPayload {
  challenge: string;
  difficulty: number;
  expires: number;
}

export type ChallengeToken = string;

export interface ChallengeSolution {
  nonce: string;
  hash: string;
}

function generateChallenge(length = 8): string {
  const buffer = crypto.randomBytes(length);
  return buffer.toString('base64').slice(0, length);
}

function createChallengePayload(difficulty: number, ttlSeconds: number): ChallengeTokenPayload {
  return {
    challenge: generateChallenge(),
    difficulty,
    expires: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
}

function signChallenge(payload: ChallengeTokenPayload): ChallengeToken {
  return jwt.sign(payload, secret);
}

function assertValidAmount(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error('Challenge amount must be a finite number');
  }

  const normalized = Math.floor(amount);
  if (normalized < 1) {
    throw new Error('Challenge amount must be at least 1');
  }

  return normalized;
}

function createSingleChallenge(difficulty: number, ttlSeconds: number): ChallengeToken {
  const payload = createChallengePayload(difficulty, ttlSeconds);
  return signChallenge(payload);
}

/**
 * Creates one or more PoW challenges and returns them as signed JWT tokens.
 *
 * @param difficulty - Number of leading zeros required in the hash (default 6)
 * @param amount - Number of challenges to create (default 4)
 * @param ttlSeconds - Time to live for each challenge in seconds (default 30)
 * @returns An array of JWT challenge tokens
 */
export function createChallenge(
  difficulty: number = 5,
  amount: number = 4,
  ttlSeconds: number = 30
): ChallengeToken[] {
  const normalizedAmount = assertValidAmount(amount);

  const challenges = Array.from({ length: normalizedAmount }, () => createSingleChallenge(difficulty, ttlSeconds));
  return challenges;
}

function solveSingleChallenge(token: ChallengeToken): ChallengeSolution | undefined {
  try {
    const payload = jwt.decode(token) as ChallengeTokenPayload | null;
    if (!payload) return undefined;

    const { challenge, difficulty } = payload;
    const prefix = '0'.repeat(difficulty);

    let nonce = 0;
    while (true) {
      const hash = crypto
        .createHash('sha256')
        .update(`${challenge}${nonce}`)
        .digest('hex');

      if (hash.startsWith(prefix)) {
        return { nonce: String(nonce), hash };
      }

      nonce++;
    }
  } catch (err) {
    return undefined;
  }
}

function verifySingleSolution(token: ChallengeToken, nonce: number | string | undefined): boolean {
  if (nonce === undefined || nonce === null) {
    return false;
  }

  try {
    const payload = jwt.verify(token, secret) as ChallengeTokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.expires < now) return false;

    const nonceValue = typeof nonce === 'number' ? String(nonce) : nonce;
    const hash = crypto
      .createHash('sha256')
      .update(`${payload.challenge}${nonceValue}`)
      .digest('hex');

    const prefix = '0'.repeat(payload.difficulty);
    return hash.startsWith(prefix);
  } catch (err) {
    return false;
  }
}

/**
 * Solves one or more PoW challenges encoded in JWT tokens.
 *
 * @param token - The JWT challenge token or an array of tokens
 * @returns The nonce/hash pair for single input or an array of them for multiple tokens
 */
export function solveChallenge(token: ChallengeToken): ChallengeSolution | undefined;
export function solveChallenge(token: ChallengeToken[]): ChallengeSolution[] | undefined;
export function solveChallenge(
  token: ChallengeToken | ChallengeToken[]
): ChallengeSolution | ChallengeSolution[] | undefined {
  if (Array.isArray(token)) {
    const solutions: ChallengeSolution[] = [];

    for (const singleToken of token) {
      const solution = solveSingleChallenge(singleToken);
      if (!solution) {
        return undefined;
      }

      solutions.push(solution);
    }

    return solutions;
  }

  const solution = solveSingleChallenge(token);
  return solution;
}

/**
 * Verifies a PoW solution returned by the client.
 *
 * @param token - The original JWT issued as the challenge (single token or array of tokens)
 * @param nonce - The nonce/answer submitted by the client (single nonce, array of nonces, or array of solution objects)
 * @returns true only if every provided solution is valid; otherwise false
 */
export function verifySolution(
  token: ChallengeToken | ChallengeToken[],
  nonce: number | string | Array<number | string> | ChallengeSolution | ChallengeSolution[]
): boolean {
  if (Array.isArray(token)) {
    let nonces: Array<number | string>;
    if (Array.isArray(nonce)) {
      if (nonce.length !== token.length) {
        return false;
      }
      if (nonce.length > 0 && typeof nonce[0] === 'object' && 'nonce' in nonce[0]) {
        nonces = (nonce as ChallengeSolution[]).map(s => s.nonce);
      } else {
        nonces = nonce as Array<number | string>;
      }
    } else {
      return false;
    }

    for (let index = 0; index < token.length; index++) {
      const challengeToken = token[index];
      const nonceEntry = nonces[index];

      if (challengeToken === undefined || nonceEntry === undefined) {
        return false;
      }

      if (!verifySingleSolution(challengeToken, nonceEntry)) {
        return false;
      }
    }

    return true;
  }

  let effectiveNonce: number | string;
  if (Array.isArray(nonce)) {
    if (nonce.length === 0) {
      return false;
    }
    if (typeof nonce[0] === 'object' && 'nonce' in nonce[0]) {
      effectiveNonce = (nonce[0] as ChallengeSolution).nonce;
    } else {
      effectiveNonce = nonce[0] as number | string;
    }
  } else if (typeof nonce === 'object' && 'nonce' in nonce) {
    effectiveNonce = (nonce as ChallengeSolution).nonce;
  } else {
    effectiveNonce = nonce as number | string;
  }

  if (effectiveNonce === undefined) {
    return false;
  }
  const result = verifySingleSolution(token, effectiveNonce);
  return result;
}