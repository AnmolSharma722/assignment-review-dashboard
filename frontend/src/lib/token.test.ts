import { describe, expect, it } from 'vitest';
import { checkToken, createToken, hashPassword, SESSION_TTL_SECONDS } from './token';

const user = { id: 'stu-aarav', role: 'student' as const, name: 'Aarav Mehta' };
const NOW = Date.UTC(2026, 10, 10, 12, 0, 0);

describe('session token', () => {
  it('has three JWT-style parts and a verifiable payload', () => {
    const token = createToken(user, NOW);
    expect(token.split('.')).toHaveLength(3);

    const check = checkToken(token, NOW + 1000);
    expect(check.valid).toBe(true);
    if (check.valid) {
      expect(check.payload.sub).toBe('stu-aarav');
      expect(check.payload.role).toBe('student');
      expect(check.payload.exp - check.payload.iat).toBe(SESSION_TTL_SECONDS);
    }
  });

  it('survives non-ASCII names', () => {
    const token = createToken({ ...user, name: 'Zoë Müller 李' }, NOW);
    const check = checkToken(token, NOW);
    expect(check.valid && check.payload.name).toBe('Zoë Müller 李');
  });

  it('rejects an expired token', () => {
    const token = createToken(user, NOW, 60);
    expect(checkToken(token, NOW + 59_000).valid).toBe(true);
    expect(checkToken(token, NOW + 61_000)).toEqual({ valid: false, reason: 'expired' });
  });

  it('rejects a tampered payload (e.g. someone editing their role)', () => {
    const [header, body, signature] = createToken(user, NOW).split('.');
    const forged = btoa(JSON.stringify({ sub: 'prof-meera', role: 'professor', name: 'x', iat: 1, exp: 9_999_999_999 }))
      .replace(/=+$/, '');
    expect(checkToken(`${header}.${forged}.${signature}`, NOW)).toEqual({ valid: false, reason: 'tampered' });
    expect(body).not.toBe(forged);
  });

  it('rejects malformed input', () => {
    expect(checkToken(null).valid).toBe(false);
    expect(checkToken('').valid).toBe(false);
    expect(checkToken('only.two').valid).toBe(false);
    expect(checkToken('a.b.c').valid).toBe(false);
  });
});

describe('password hashing', () => {
  it('is deterministic, salted by email and never equals the password', () => {
    expect(hashPassword('A@x.com', 'Secret123')).toBe(hashPassword('a@x.com ', 'Secret123'));
    expect(hashPassword('a@x.com', 'Secret123')).not.toBe(hashPassword('b@x.com', 'Secret123'));
    expect(hashPassword('a@x.com', 'Secret123')).not.toContain('Secret123');
  });
});
