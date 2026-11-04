import { CalendarDays } from 'lucide-react';
import { cn } from '../../lib/cn';
import { dueLabel, formatDate } from '../../lib/dates';

interface DueDateProps {
  dueDate: string;
  now: Date;
  /** Highlight in red (assignment is overdue and still outstanding). */
  overdue?: boolean;
  /** Show "Due in 3 days" / "2 days overdue" after the date. */
  showRelative?: boolean;
}

export function DueDate({ dueDate, now, overdue = false, showRelative = true }: DueDateProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm',
        overdue ? 'font-semibold text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400',
      )}
    >
      <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">Due date: </span>
      <time dateTime={dueDate}>{formatDate(dueDate)}</time>
      {showRelative && (
        <>
          <span aria-hidden="true">·</span>
          <span>{dueLabel(dueDate, now)}</span>
        </>
      )}
    </span>
  );
}
