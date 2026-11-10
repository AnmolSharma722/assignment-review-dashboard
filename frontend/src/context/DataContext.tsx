import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as rules from '../lib/rules';
import {
  STORAGE_KEYS,
  loadDatabase,
  parseDatabase,
  resetDatabase,
  saveDatabase,
} from '../lib/storage';
import type {
  Acknowledgement,
  Assignment,
  AssignmentInput,
  Course,
  CourseInput,
  Database,
  Group,
  RegisterInput,
  User,
} from '../types';

type Status = 'loading' | 'ready' | 'error';

/** What an action returns to the UI: success (plus any created record) or an error message. */
export type Outcome<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

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

  registerUser: (input: RegisterInput) => Outcome<{ user: User }>;
  createCourse: (professorId: string, input: CourseInput) => Outcome<{ course: Course }>;
  enrollStudent: (courseId: string, studentId: string) => Outcome;
  createAssignment: (
    professorId: string,
    courseId: string,
    input: AssignmentInput,
  ) => Outcome<{ assignment: Assignment }>;
  updateAssignment: (professorId: string, assignmentId: string, input: AssignmentInput) => Outcome;
  deleteAssignment: (professorId: string, assignmentId: string) => Outcome;
  createGroup: (studentId: string, courseId: string, name: string) => Outcome<{ group: Group }>;
  joinGroup: (studentId: string, groupId: string) => Outcome<{ group: Group }>;
  acknowledge: (actorId: string, assignmentId: string) => Outcome<{ acknowledgement: Acknowledgement }>;
}

const DataContext = createContext<DataContextValue | null>(null);

const messageOf = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [db, setDb] = useState<Database | null>(null);

  // The ref always holds the latest database, so an action can run its rule against
  // current data and report success/failure synchronously (setState can't do that).
  const dbRef = useRef<Database | null>(null);
  const commit = useCallback((next: Database) => {
    dbRef.current = next;
    setDb(next);
  }, []);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      commit(await loadDatabase());
      setStatus('ready');
    } catch (e) {
      setError(messageOf(e));
      setStatus('error');
    }
  }, [commit]);

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
        commit(parseDatabase(event.newValue));
      } catch {
        /* ignore a malformed write from another tab */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [commit]);

  const resetDemoData = useCallback(() => {
    try {
      commit(resetDatabase());
      setError(null);
      setStatus('ready');
    } catch (e) {
      setError(messageOf(e));
      setStatus('error');
    }
  }, [commit]);

  /** Runs a pure rule against the current database and commits the result. */
  const run = useCallback(
    <T extends object>(rule: (current: Database) => rules.Result<T>): Outcome<T> => {
      const current = dbRef.current;
      if (!current) return { ok: false, error: 'The data is still loading. Please try again.' };
      const result = rule(current);
      if (!result.ok) return result;
      const { db: next, ...rest } = result;
      commit(next);
      return rest as Outcome<T>; // `rest` still carries `ok: true` plus any created record
    },
    [commit],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      status,
      error,
      persistError,
      db,
      reload: () => void load(),
      resetDemoData,
      registerUser: (input) => run((d) => rules.registerUser(d, input)),
      createCourse: (professorId, input) => run((d) => rules.createCourse(d, professorId, input)),
      enrollStudent: (courseId, studentId) => run((d) => rules.enrollStudent(d, courseId, studentId)),
      createAssignment: (professorId, courseId, input) =>
        run((d) => rules.createAssignment(d, professorId, courseId, input)),
      updateAssignment: (professorId, assignmentId, input) =>
        run((d) => rules.updateAssignment(d, professorId, assignmentId, input)),
      deleteAssignment: (professorId, assignmentId) =>
        run((d) => rules.deleteAssignment(d, professorId, assignmentId)),
      createGroup: (studentId, courseId, name) => run((d) => rules.createGroup(d, studentId, courseId, name)),
      joinGroup: (studentId, groupId) => run((d) => rules.joinGroup(d, studentId, groupId)),
      acknowledge: (actorId, assignmentId) => run((d) => rules.acknowledgeAssignment(d, actorId, assignmentId)),
    }),
    [status, error, persistError, db, load, resetDemoData, run],
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
