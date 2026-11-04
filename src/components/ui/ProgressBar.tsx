import { cn } from '../../lib/cn';

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  /** Accessible name, e.g. "Class completion for Binary Trees Problem Set". */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({ value, label, size = 'md', className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        'w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800',
        size === 'sm' ? 'h-2' : 'h-3',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          clamped === 100 ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
