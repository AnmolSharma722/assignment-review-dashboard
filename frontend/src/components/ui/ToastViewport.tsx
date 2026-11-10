import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const tones = {
  success: { Icon: CircleCheck, icon: 'text-emerald-400 dark:text-emerald-600' },
  error: { Icon: CircleAlert, icon: 'text-red-400 dark:text-red-600' },
  info: { Icon: Info, icon: 'text-sky-400 dark:text-sky-600' },
} as const;

/**
 * Stack of toast messages. The live region is always mounted (only its children
 * change) because screen readers announce changes inside an existing live region
 * far more reliably than newly inserted ones.
 */
export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {toasts.map((toast) => {
        const { Icon, icon } = tones[toast.tone];
        return (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm animate-pop-in items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg ring-1 ring-white/10 dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-900/10"
          >
            <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', icon)} />
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
              className="-m-1 rounded-md p-1 text-slate-300 hover:bg-white/10 dark:text-slate-600 dark:hover:bg-slate-900/10"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
