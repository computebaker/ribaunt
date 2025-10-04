import { createChallenge, solveChallenge, verifySolution } from '../src/index';
import { describe, expect, it } from '@jest/globals';

describe('test challenge flow', () => {
    it('creates the default number of JWT challenge tokens', () => {
        const tokens = createChallenge(4,3);
        console.log('createChallenge (default amount) =>', tokens);

        expect(Array.isArray(tokens)).toBe(true);
        expect(tokens).toHaveLength(3);
        tokens.forEach((token) => {
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3);
        });
    });

    it('solves multiple challenges and validates each solution', () => {
        const tokens = createChallenge(4, 2);
        console.log('createChallenge (multiple) =>', tokens);
        const solutions = solveChallenge(tokens);
        console.log('solveChallenge (multiple) =>', solutions);

        expect(Array.isArray(solutions)).toBe(true);
        expect(solutions).toHaveLength(2);

        const nonces = (solutions ?? []).map((solution) => solution.nonce);
        nonces.forEach((nonce) => {
            expect(typeof nonce).toBe('string');
            expect(nonce.length).toBeGreaterThan(0);
        });

            const verification = verifySolution(tokens, nonces);
            console.log('verifySolution (multiple) =>', verification);
            expect(verification).toBe(true);
    });

    it('solves a single challenge and validates the solution', () => {
        const [token] = createChallenge(6, 1);
        console.log('createChallenge (single) =>', token);
        const solution = solveChallenge(token);
        console.log('solveChallenge (single) =>', solution);

        expect(solution).toBeTruthy();
        expect(typeof solution?.nonce).toBe('string');
        expect(solution?.nonce.length).toBeGreaterThan(0);

        const isValid = verifySolution(token, solution!.nonce);
        console.log('verifySolution (single) =>', isValid);
        expect(isValid).toBe(true);
    });

    it('rejects an invalid nonce for a valid token', () => {
        const [token] = createChallenge(6, 1);
        console.log('createChallenge (invalid nonce test) =>', token);
        const isValid = verifySolution(token, 'invalid-nonce');
        console.log('verifySolution (invalid nonce) =>', isValid);
        expect(isValid).toBe(false);
    });

    it('returns false when the challenge token is tampered with', () => {
        const [token] = createChallenge(6, 1);
        console.log('createChallenge (tampered test) =>', token);
        const tamperedToken = `${token}tampered`;
        const solution = solveChallenge(token);
        console.log('solveChallenge (tampered test) =>', solution);

        const isValid = solution ? verifySolution(tamperedToken, solution.nonce) : false;
        console.log('verifySolution (tampered token) =>', isValid);
        expect(isValid).toBe(false);
    });

    it('returns undefined when solving fails for an invalid token', () => {
        const solution = solveChallenge('not-a-valid-token');
        console.log('solveChallenge (invalid token) =>', solution);
        expect(solution).toBeUndefined();
    });

    it('marks mismatched nonce arrays as invalid', () => {
        const tokens = createChallenge(6, 2);
        console.log('createChallenge (mismatched nonce test) =>', tokens);
        const verification = verifySolution(tokens, ['only-one-nonce']);
        console.log('verifySolution (mismatched nonce) =>', verification);

        expect(verification).toBe(false);
    });
});