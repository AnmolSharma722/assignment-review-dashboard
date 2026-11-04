import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearSession, readSession, writeSession } from '../lib/storage';
import type { User } from '../types';
import { useData } from './DataContext';

interface AuthContextValue {
  /** The logged-in user, or null when nobody is signed in. */
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Mock authentication: "logging in" just remembers a user id (in localStorage so it
 * survives a refresh). The user object is always looked up from the database, so a
 * stale id pointing at a deleted user simply resolves to "logged out".
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { db } = useData();
  const [userId, setUserId] = useState<string | null>(() => readSession());

  const user = useMemo(
    () => (db && userId ? (db.users.find((u) => u.id === userId) ?? null) : null),
    [db, userId],
  );

  const login = useCallback((id: string) => {
    writeSession(id);
    setUserId(id);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUserId(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
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
  if (!user) throw new Error('useCurrentUser called while logged out');
  return user;
}
