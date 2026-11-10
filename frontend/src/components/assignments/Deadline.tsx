import { CalendarClock } from 'lucide-react';
import { cn } from '../../lib/cn';
import { deadlineLabel, formatDateTime } from '../../lib/dates';

interface DeadlineProps {
  deadline: string;
  now: Date;
  /** Highlight in red (the deadline passed and the work is still outstanding). */
  overdue?: boolean;
  /** Show "Due in 3 days" / "2 hours overdue" after the date. */
  showRelative?: boolean;
}

export function Deadline({ deadline, now, overdue = false, showRelative = true }: DeadlineProps) {
  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-center gap-x-1.5 text-sm',
        overdue ? 'font-semibold text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400',
      )}
    >
      <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">Deadline: </span>
      <time dateTime={deadline}>{formatDateTime(deadline)}</time>
      {showRelative && (
        <>
          <span aria-hidden="true">·</span>
          <span>{deadlineLabel(deadline, now)}</span>
        </>
      )}
    </span>
  );
}
