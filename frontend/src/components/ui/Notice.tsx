import { CircleCheck } from 'lucide-react';

/**
 * Toast-style confirmation. The live region is always mounted (and only its
 * content changes) because screen readers announce changes to existing live regions
 * far more reliably than newly inserted ones.
 */
export function Notice({ message }: { message: string | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
    >
      {message && (
        <div className="pointer-events-auto flex animate-pop-in items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          <CircleCheck aria-hidden="true" className="size-4 text-emerald-400 dark:text-emerald-600" />
          {message}
        </div>
      )}
    </div>
  );
}
