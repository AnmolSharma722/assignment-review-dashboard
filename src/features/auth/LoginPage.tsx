import { useState } from 'react';
import { ArrowRight, ClipboardList, RotateCcw } from 'lucide-react';
import { Avatar } from '../../components/layout/Avatar';
import { ThemeToggle } from '../../components/layout/ThemeToggle';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useReadyData } from '../../context/DataContext';
import type { User } from '../../types';

function UserButton({ user, onSelect }: { user: User; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(user.id)}
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/60"
    >
      <Avatar name={user.name} role={user.role} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{user.name}</span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600"
      />
    </button>
  );
}

/** Mock login: pick a seeded user. No passwords, no real authentication. */
export function LoginPage() {
  const { login } = useAuth();
  const { db, resetDemoData } = useReadyData();
  const [confirmReset, setConfirmReset] = useState(false);

  const admins = db.users.filter((u) => u.role === 'admin');
  const students = db.users.filter((u) => u.role === 'student');

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex justify-end p-3 sm:p-4">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-10 sm:px-6">
        <div className="animate-slide-up text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
            <ClipboardList aria-hidden="true" className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
            Assignment &amp; Review Dashboard
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Choose a demo account to continue. Each user only sees their own data, and everything
            you do is saved in your browser.
          </p>
        </div>

        <div className="mt-8 grid animate-slide-up gap-8 sm:grid-cols-2" style={{ animationDelay: '80ms' }}>
          <section aria-labelledby="admins-heading">
            <h2 id="admins-heading" className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Professors <span className="font-normal text-slate-500">(Admin)</span>
            </h2>
            <ul className="space-y-2.5">
              {admins.map((u) => (
                <li key={u.id}>
                  <UserButton user={u} onSelect={login} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="students-heading">
            <h2 id="students-heading" className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Students
            </h2>
            <ul className="space-y-2.5">
              {students.map((u) => (
                <li key={u.id}>
                  <UserButton user={u} onSelect={login} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Reset demo data
          </Button>
        </div>
      </main>

      <ConfirmDialog
        open={confirmReset}
        tone="danger"
        title="Reset demo data?"
        description="This restores the original sample users and assignments and removes anything you created."
        confirmLabel="Reset data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
