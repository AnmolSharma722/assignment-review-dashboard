import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  actions?: ReactNode;
}

export function ErrorState({ title = 'Something went wrong', message, actions }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-red-200 bg-white px-6 py-10 text-center shadow-sm dark:border-red-500/30 dark:bg-slate-900"
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
        <CircleAlert aria-hidden="true" className="size-6" />
      </div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{message}</p>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
