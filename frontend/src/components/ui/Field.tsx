import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface FieldProps {
  /** id of the form control this label belongs to. */
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, required, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-600 dark:text-red-400">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';

export function inputClass(invalid: boolean): string {
  return cn(
    inputBase,
    invalid ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-700',
  );
}

/** aria props wiring an input to its hint / error text. */
export function describedBy(id: string, error?: string, hint?: string) {
  return {
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}
