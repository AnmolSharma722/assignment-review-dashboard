import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createId } from '../lib/ids';
import { isAssignedTo } from '../lib/domain';
import {
  STORAGE_KEYS,
  loadDatabase,
  parseDatabase,
  resetDatabase,
  saveDatabase,
} from '../lib/storage';
import type { Assignment, AssignmentInput, Database } from '../types';

type Status = 'loading' | 'ready' | 'error';

interface DataContextValue {
  status: Status;
  /** Why loading failed (only when status === 'error'). */
  error: string | null;
  /** Set when a save to localStorage failed; the UI shows a warning banner. */
  persistError: string | null;
  /** The database. `null` until status === 'ready'. */
  db: Database | null;
  reload: () => void;
  resetDemoData: () => void;
  createAssignment: (input: AssignmentInput, adminId: string) => Assignment;
  updateAssignment: (id: string, input: AssignmentInput, adminId: string) => void;
  deleteAssignment: (id: string, adminId: string) => void;
  submitAssignment: (assignmentId: string, studentId: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const messageOf = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [db, setDb] = useState<Database | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      setDb(await loadDatabase());
      setStatus('ready');
    } catch (e) {
      setError(messageOf(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Persist after every change. Saving is what makes data survive a refresh.
  useEffect(() => {
    if (!db) return;
    try {
      saveDatabase(db);
      setPersistError(null);
    } catch (e) {
      setPersistError(messageOf(e));
    }
  }, [db]);

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEYS.db || event.newValue === null) return;
      try {
        setDb(parseDatabase(event.newValue));
      } catch {
        /* ignore a malformed write from another tab */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((fn: (current: Database) => Database) => {
    setDb((current) => (current ? fn(current) : current));
  }, []);

  const resetDemoData = useCallback(() => {
    try {
      setDb(resetDatabase());
      setError(null);
      setStatus('ready');
    } catch (e) {
      setError(messageOf(e));
      setStatus('error');
    }
  }, []);

  // ---- mutations -------------------------------------------------------------------------
  // Each one re-checks permissions (an admin can only touch their own assignments,
  // a student can only submit what was assigned to them). The UI never offers the
  // other actions, but the data layer is the real gatekeeper.

  const createAssignment = useCallback(
    (input: AssignmentInput, adminId: string): Assignment => {
      const assignment: Assignment = {
        ...input,
        id: createId('asg'),
        createdBy: adminId,
        createdAt: new Date().toISOString(),
      };
      update((d) => ({ ...d, assignments: [...d.assignments, assignment] }));
      return assignment;
    },
    [update],
  );

  const updateAssignment = useCallback(
    (id: string, input: AssignmentInput, adminId: string) => {
      update((d) => ({
        ...d,
        assignments: d.assignments.map((a) =>
          a.id === id && a.createdBy === adminId ? { ...a, ...input } : a,
        ),
      }));
    },
    [update],
  );

  const deleteAssignment = useCallback(
    (id: string, adminId: string) => {
      update((d) => {
        const target = d.assignments.find((a) => a.id === id);
        if (!target || target.createdBy !== adminId) return d;
        return {
          ...d,
          assignments: d.assignments.filter((a) => a.id !== id),
          submissions: d.submissions.filter((s) => s.assignmentId !== id),
        };
      });
    },
    [update],
  );

  const submitAssignment = useCallback(
    (assignmentId: string, studentId: string) => {
      update((d) => {
        const assignment = d.assignments.find((a) => a.id === assignmentId);
        const alreadySubmitted = d.submissions.some(
          (s) => s.assignmentId === assignmentId && s.studentId === studentId,
        );
        if (!assignment || !isAssignedTo(assignment, studentId) || alreadySubmitted) return d;
        return {
          ...d,
          submissions: [
            ...d.submissions,
            { assignmentId, studentId, submittedAt: new Date().toISOString() },
          ],
        };
      });
    },
    [update],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      status,
      error,
      persistError,
      db,
      reload: () => void load(),
      resetDemoData,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      submitAssignment,
    }),
    [
      status,
      error,
      persistError,
      db,
      load,
      resetDemoData,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      submitAssignment,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}

/** For screens that only render once data is loaded: returns a non-null `db`. */
export function useReadyData(): Omit<DataContextValue, 'db'> & { db: Database } {
  const ctx = useData();
  if (!ctx.db) throw new Error('useReadyData called before the data finished loading');
  return ctx as Omit<DataContextValue, 'db'> & { db: Database };
}
