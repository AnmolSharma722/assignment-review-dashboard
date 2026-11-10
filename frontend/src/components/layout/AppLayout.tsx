import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AppHeader } from './AppHeader';

/** Page chrome for the signed-in app: skip link, header, main landmark. */
export function AppLayout({ children }: { children: ReactNode }) {
  const { persistError } = useData();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <AppHeader />
      {persistError && (
        <div
          role="alert"
          className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
        >
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
          {persistError}
        </div>
      )}
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
