import { createChallenge, solveChallenge, verifySolution, LocalReplayStore } from '../src/index';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

const originalSecret = process.env.RIBAUNT_SECRET;

afterEach(() => {
    if (originalSecret === undefined) {
        delete process.env.RIBAUNT_SECRET;
        return;
    }

    process.env.RIBAUNT_SECRET = originalSecret;
    jest.useRealTimers();
});

describe('test challenge flow', () => {
    it('creates the default number of JWT challenge tokens', () => {
        const tokens = createChallenge(2,3);

        expect(Array.isArray(tokens)).toBe(true);
        expect(tokens).toHaveLength(3);
        tokens.forEach((token) => {
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3);
        });
    });

    it('solves multiple challenges and validates each solution', async () => {
        const tokens = createChallenge(2, 2);
        const solutions = solveChallenge(tokens);

        expect(Array.isArray(solutions)).toBe(true);
        expect(solutions).toHaveLength(2);

        const nonces = (solutions ?? []).map((solution) => solution.nonce);
        nonces.forEach((nonce) => {
            expect(typeof nonce).toBe('string');
            expect(nonce.length).toBeGreaterThan(0);
        });

                const verification = await verifySolution(tokens, nonces);
                expect(verification).toBe(true);
    });

            it('solves a single challenge and validates the solution', async () => {
        const [token] = createChallenge(3, 1);
        const solution = solveChallenge(token);

        expect(solution).toBeTruthy();
        expect(typeof solution?.nonce).toBe('string');
        expect(solution?.nonce.length).toBeGreaterThan(0);

        const isValid = await verifySolution(token, solution!.nonce);
        expect(isValid).toBe(true);
    });

    it('rejects an invalid nonce for a valid token', async () => {
        const [token] = createChallenge(3, 1);
        const isValid = await verifySolution(token, 'invalid-nonce');
        expect(isValid).toBe(false);
    });

    it('returns false when the challenge token is tampered with', async () => {
        const [token] = createChallenge(3, 1);
        const tamperedToken = `${token}tampered`;
        const solution = solveChallenge(token);

        const isValid = solution ? await verifySolution(tamperedToken, solution.nonce, { debug: false }) : false;
        expect(isValid).toBe(false);
    });

    it('returns undefined when solving fails for an invalid token', () => {
        const solution = solveChallenge('not-a-valid-token');
        expect(solution).toBeUndefined();
    });

    it('marks mismatched nonce arrays as invalid', async () => {
        const tokens = createChallenge(3, 2);
        const verification = await verifySolution(tokens, ['only-one-nonce']);

        expect(verification).toBe(false);
    });

    it('rejects expired challenges', async () => {
        jest.useFakeTimers();
        const issuedAt = new Date('2026-01-01T00:00:00Z');
        jest.setSystemTime(issuedAt);

        const [token] = createChallenge(2, 1, 1);
        const solution = solveChallenge(token);

        jest.setSystemTime(new Date('2026-01-01T00:00:03Z'));

        expect(solution).toBeTruthy();
        await expect(verifySolution(token, solution!.nonce)).resolves.toBe(false);
    });

    it('returns false for malformed tokens during verification', async () => {
        await expect(verifySolution('not-a-jwt', '123', { debug: false })).resolves.toBe(false);
        await expect(verifySolution(['still-not-a-jwt'], ['123'], { debug: false })).resolves.toBe(false);
    });

    it('rejects invalid nonce payload shapes', async () => {
        const [token] = createChallenge(2, 1, 30);

        await expect(verifySolution(token, { nonce: '', hash: '' })).resolves.toBe(false);
        await expect(verifySolution([token], [{ nonce: '', hash: '' }])).resolves.toBe(false);
    });

    it('keeps replay disabled by default for backwards compatibility', async () => {
        const [token] = createChallenge(2, 1, 30);
        const solution = solveChallenge(token);

        expect(solution).toBeTruthy();
        await expect(verifySolution(token, solution!.nonce)).resolves.toBe(true);
        await expect(verifySolution(token, solution!.nonce)).resolves.toBe(true);
    });

    it('blocks replay when local replay prevention is enabled', async () => {
        const [token] = createChallenge(2, 1, 30);
        const solution = solveChallenge(token);

        expect(solution).toBeTruthy();
        await expect(verifySolution(token, solution!.nonce, { replayPrevention: 'local' })).resolves.toBe(true);
        await expect(verifySolution(token, solution!.nonce, { replayPrevention: 'local' })).resolves.toBe(false);
    });

    it('supports custom remote replay stores', async () => {
        const [token] = createChallenge(2, 1, 30);
        const solution = solveChallenge(token);
        const consumed = new Set<string>();

        const remoteStore = {
            consume: async (jti: string) => {
                if (consumed.has(jti)) {
                    return false;
                }

                consumed.add(jti);
                return true;
            },
        };

        expect(solution).toBeTruthy();
        await expect(verifySolution(token, solution!.nonce, {
            replayPrevention: 'remote',
            replayStore: remoteStore,
        })).resolves.toBe(true);
        await expect(verifySolution(token, solution!.nonce, {
            replayPrevention: 'remote',
            replayStore: remoteStore,
        })).resolves.toBe(false);
    });

    it('throws when remote replay prevention is selected without a store', async () => {
        const [token] = createChallenge(2, 1, 30);
        const solution = solveChallenge(token);

        expect(solution).toBeTruthy();
        await expect(verifySolution(token, solution!.nonce, {
            replayPrevention: 'remote',
        })).resolves.toBe(false);
    });

    it('throws for invalid challenge config values', () => {
        expect(() => createChallenge(0, 1, 30)).toThrow('Challenge difficulty must be at least 1');
        expect(() => createChallenge(1, 0, 30)).toThrow('Challenge amount must be at least 1');
        expect(() => createChallenge(1, 1, 0)).toThrow('Challenge TTL must be at least 1 second');
        expect(() => createChallenge(Number.NaN, 1, 30)).toThrow('Challenge difficulty must be a finite number');
    });

    it('throws when secret-dependent operations run without RIBAUNT_SECRET', async () => {
        delete process.env.RIBAUNT_SECRET;

        expect(() => createChallenge(1, 1, 30)).toThrow('RIBAUNT_SECRET environment variable is not set!');
        await expect(verifySolution('not-a-real-token', '1', { debug: false })).resolves.toBe(false);
    });

    it('can use an isolated local replay store instance', async () => {
        const [token] = createChallenge(2, 1, 30);
        const solution = solveChallenge(token);
        const localStore = new LocalReplayStore();

        expect(solution).toBeTruthy();

        const adapter = {
            consume: (jti: string, expiresAt: number) => localStore.consume(jti, expiresAt),
        };

        await expect(verifySolution(token, solution!.nonce, {
            replayPrevention: 'remote',
            replayStore: adapter,
        })).resolves.toBe(true);

        await expect(verifySolution(token, solution!.nonce, {
            replayPrevention: 'remote',
            replayStore: adapter,
        })).resolves.toBe(false);
    });
});
