import { CircleCheck, Clock, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { StudentStatus } from '../../types';

const config: Record<StudentStatus, { label: string; Icon: LucideIcon; classes: string }> = {
  submitted: {
    label: 'Submitted',
    Icon: CircleCheck,
    classes:
      'bg-emerald-50 text-emerald-800 ring-emerald-600/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30',
  },
  pending: {
    label: 'Pending',
    Icon: Clock,
    classes:
      'bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
  },
  overdue: {
    label: 'Overdue',
    Icon: TriangleAlert,
    classes:
      'bg-red-50 text-red-800 ring-red-600/25 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/30',
  },
};

interface StatusBadgeProps {
  status: StudentStatus;
  /** Override the default wording (the admin view says "Not submitted"). */
  label?: string;
}

/** Status is always conveyed by icon + text, never by colour alone. */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { label: defaultLabel, Icon, classes } = config[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        classes,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label ?? defaultLabel}
    </span>
  );
}
