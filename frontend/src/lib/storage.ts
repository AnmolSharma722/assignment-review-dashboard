/**
 * Mock "API" layer over localStorage.
 *
 * The rest of the app only talks to these functions, so swapping in a real
 * backend later means re-implementing this one file. `loadDatabase` is async
 * (with a small artificial latency) so the UI has real loading and error
 * states to handle, just like it would with a network call.
 */
import { createSeedData } from '../data/seed';
import type { Database } from '../types';

export const STORAGE_KEYS = {
  db: 'ard:db:v1',
  session: 'ard:session:v1',
  theme: 'ard:theme:v1',
} as const;

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 450;

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Parses + shape-checks a stored JSON string. Throws StorageError if unusable. */
export function parseDatabase(raw: string): Database {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StorageError('The saved data is corrupted and could not be read.');
  }
  const db = parsed as Partial<Database> | null;
  const valid =
    !!db &&
    db.version === 1 &&
    Array.isArray(db.users) &&
    Array.isArray(db.assignments) &&
    Array.isArray(db.submissions);
  if (!valid) throw new StorageError('The saved data has an unexpected format.');
  return db as Database;
}

export function saveDatabase(db: Database): void {
  try {
    localStorage.setItem(STORAGE_KEYS.db, JSON.stringify(db));
  } catch {
    throw new StorageError('Your changes could not be saved (browser storage is unavailable or full).');
  }
}

/** Replaces everything with a fresh copy of the demo data. */
export function resetDatabase(): Database {
  const fresh = createSeedData();
  saveDatabase(fresh);
  return fresh;
}

export async function loadDatabase(): Promise<Database> {
  await delay(LATENCY_MS);
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEYS.db);
  } catch {
    throw new StorageError('Browser storage is unavailable, so data cannot be loaded.');
  }
  if (raw === null) return resetDatabase(); // first visit: seed demo data
  return parseDatabase(raw);
}

// ---- session (which user is "logged in") --------------------------------------------------

export function readSession(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.session);
  } catch {
    return null;
  }
}

export function writeSession(userId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.session, userId);
  } catch {
    /* session just won't survive a refresh */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    /* ignore */
  }
}
