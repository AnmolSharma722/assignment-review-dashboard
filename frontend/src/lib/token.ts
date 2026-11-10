/**
 * Simulated JWT-style session handling.
 *
 * A token has the familiar three parts, `header.payload.signature`, each
 * base64url-encoded. The payload carries `sub` (user id), `role`, `name`, `iat`
 * and `exp` (seconds since epoch). The "signature" is a keyed hash that lets us
 * detect tampering and expiry.
 *
 * IMPORTANT: this is a front-end-only simulation for the assignment. The secret
 * ships in the bundle and the hash is not cryptographically secure, so none of
 * this protects anything. With a real backend the server would issue and verify
 * the token; the rest of the app (storage, guards, expiry) would stay the same.
 */
import type { Role } from '../types';

const SECRET = 'ard-mock-signing-secret';
/** Sessions last 8 hours. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface TokenPayload {
  sub: string;
  role: Role;
  name: string;
  iat: number;
  exp: number;
}

/** Two seeded 32-bit FNV-1a hashes concatenated into a 16-char hex string. Not secure. */
export function hashString(input: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b ^ code, 0x85ebca6b) >>> 0;
    b = (b ^ (b >>> 13)) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

export const hashPassword = (email: string, password: string): string =>
  hashString(`pw:${email.trim().toLowerCase()}:${password}`);

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

const sign = (data: string) => toBase64Url(hashString(`${data}.${SECRET}`));

export function createToken(
  user: { id: string; role: Role; name: string },
  nowMs: number = Date.now(),
  ttlSeconds: number = SESSION_TTL_SECONDS,
): string {
  const iat = Math.floor(nowMs / 1000);
  const payload: TokenPayload = { sub: user.id, role: user.role, name: user.name, iat, exp: iat + ttlSeconds };
  const header = toBase64Url(JSON.stringify({ alg: 'MOCK', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

export type TokenCheck =
  | { valid: true; payload: TokenPayload }
  | { valid: false; reason: 'malformed' | 'tampered' | 'expired' };

/** Validates structure, signature and expiry. */
export function checkToken(token: string | null, nowMs: number = Date.now()): TokenCheck {
  if (!token) return { valid: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'malformed' };
  const [header, body, signature] = parts;
  if (sign(`${header}.${body}`) !== signature) return { valid: false, reason: 'tampered' };

  let payload: TokenPayload;
  try {
    payload = JSON.parse(fromBase64Url(body)) as TokenPayload;
  } catch {
    return { valid: false, reason: 'malformed' };
  }
  const shapeOk =
    typeof payload.sub === 'string' &&
    (payload.role === 'student' || payload.role === 'professor') &&
    typeof payload.exp === 'number';
  if (!shapeOk) return { valid: false, reason: 'malformed' };
  if (payload.exp * 1000 <= nowMs) return { valid: false, reason: 'expired' };
  return { valid: true, payload };
}
