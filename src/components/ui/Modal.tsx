import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

/**
 * Accessible modal dialog:
 *  - rendered in a portal, role="dialog" + aria-modal, labelled by its title
 *  - focus moves into the dialog, is trapped while open, and returns to the trigger on close
 *  - Escape and backdrop click close it; background scroll is locked
 *  - give an element `data-autofocus` to choose what receives initial focus
 */
export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the latest onClose without re-running the focus effect on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));

    (panel.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0] ?? panel).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-slate-900/60 backdrop-blur-sm"
        onMouseDown={() => onCloseRef.current()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full animate-pop-in flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800',
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => onCloseRef.current()}
            className="-mr-1.5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
