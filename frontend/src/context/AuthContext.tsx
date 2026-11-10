import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authenticate } from '../lib/rules';
import { STORAGE_KEYS, clearToken, delay, readToken, writeToken } from '../lib/storage';
import { checkToken, createToken } from '../lib/token';
import type { RegisterInput, User } from '../types';
import { useData } from './DataContext';

export type AuthOutcome = { ok: true; user: User } | { ok: false; error: string };

interface AuthContextValue {
  /** The signed-in user, or null when nobody is signed in. */
  user: User | null;
  /** Why the last session ended ("expired", "signed out"); shown once on the login page. */
  sessionNotice: string | null;
  clearSessionNotice: () => void;
  login: (email: string, password: string) => Promise<AuthOutcome>;
  register: (input: RegisterInput) => Promise<AuthOutcome>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EXPIRED_NOTICE = 'Your session has expired. Please sign in again.';
const MAX_TIMEOUT = 2_000_000_000; // setTimeout overflows above ~24.8 days

/**
 * Session handling with a simulated JWT:
 *  - login / register issue a signed token that is stored in localStorage
 *  - on every load the token is verified (signature + expiry); a bad one is discarded
 *  - the session ends automatically when the token expires, and logout clears it
 *  - the user object is always looked up in the database by the token's `sub`
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { db, registerUser } = useData();
  const [token, setToken] = useState<string | null>(() => readToken());
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const payload = useMemo(() => {
    const check = checkToken(token);
    return check.valid ? check.payload : null;
  }, [token]);

  const endSession = useCallback((notice: string | null) => {
    clearToken();
    setToken(null);
    setSessionNotice(notice);
  }, []);

  // Discard a tampered / malformed / expired token found on load.
  useEffect(() => {
    if (!token) return;
    const check = checkToken(token);
    if (!check.valid) {
      endSession(check.reason === 'expired' ? EXPIRED_NOTICE : 'Please sign in to continue.');
    }
  }, [token, endSession]);

  // End the session the moment the token expires.
  useEffect(() => {
    if (!payload) return;
    const remaining = Math.min(Math.max(payload.exp * 1000 - Date.now(), 0), MAX_TIMEOUT);
    const id = setTimeout(() => endSession(EXPIRED_NOTICE), remaining);
    return () => clearTimeout(id);
  }, [payload, endSession]);

  // Signing in or out in another tab applies here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.token) setToken(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const user = useMemo(
    () => (db && payload ? (db.users.find((u) => u.id === payload.sub) ?? null) : null),
    [db, payload],
  );

  // A valid token for a user that no longer exists (e.g. after resetting demo data).
  useEffect(() => {
    if (db && payload && !user) endSession('Please sign in again.');
  }, [db, payload, user, endSession]);

  const startSession = useCallback((signedIn: User) => {
    const next = createToken(signedIn);
    writeToken(next);
    setToken(next);
    setSessionNotice(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthOutcome> => {
      await delay(600); // simulated network round-trip
      const found = db ? authenticate(db, email, password) : null;
      // One message for "no such account" and "wrong password" so it doesn't reveal which emails exist.
      if (!found) return { ok: false, error: 'Incorrect email or password. Please try again.' };
      startSession(found);
      return { ok: true, user: found };
    },
    [db, startSession],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthOutcome> => {
      await delay(700);
      const outcome = registerUser(input);
      if (!outcome.ok) return outcome;
      startSession(outcome.user);
      return { ok: true, user: outcome.user };
    },
    [registerUser, startSession],
  );

  const logout = useCallback(() => endSession('You have been signed out.'), [endSession]);
  const clearSessionNotice = useCallback(() => setSessionNotice(null), []);

  const value = useMemo(
    () => ({ user, sessionNotice, clearSessionNotice, login, register, logout }),
    [user, sessionNotice, clearSessionNotice, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** For screens behind the login: returns a non-null user. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser called while signed out');
  return user;
}
