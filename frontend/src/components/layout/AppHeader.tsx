import { ClipboardList, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { paths } from '../../lib/routes';
import { Avatar } from './Avatar';
import { ThemeToggle } from './ThemeToggle';

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          to={user ? paths.home(user.role) : paths.login}
          className="flex items-center gap-2.5 rounded-lg"
          aria-label="Assignment Dashboard home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <ClipboardList aria-hidden="true" className="size-5" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            Assignment<span className="hidden sm:inline"> &amp; Review</span> Dashboard
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {user && (
            <div className="mr-1 flex items-center gap-2.5">
              <Avatar name={user.name} role={user.role} size="sm" />
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.role === 'professor' ? 'Professor' : 'Student'}
                </p>
              </div>
            </div>
          )}
          <ThemeToggle />
          {user && (
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
