import { useId } from 'react';
import { CircleCheck, UserRound } from 'lucide-react';
import { DriveLink } from '../../components/assignments/DriveLink';
import { DueDate } from '../../components/assignments/DueDate';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { cn } from '../../lib/cn';
import { formatTimestamp } from '../../lib/dates';
import type { Assignment, StudentStatus } from '../../types';

interface AssignmentCardProps {
  assignment: Assignment;
  professorName: string;
  status: StudentStatus;
  submittedAt?: string;
  now: Date;
  /** Position in the list, used to stagger the entrance animation. */
  index: number;
  /** Step 1 of the two-step flow: opens the final confirmation dialog. */
  onRequestSubmit: (assignmentId: string) => void;
}

export function AssignmentCard({
  assignment,
  professorName,
  status,
  submittedAt,
  now,
  index,
  onRequestSubmit,
}: AssignmentCardProps) {
  const titleId = useId();
  const overdue = status === 'overdue';
  const submitted = status === 'submitted';

  return (
    <article
      aria-labelledby={titleId}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className={cn(
        'flex h-full animate-slide-up flex-col rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900',
        overdue
          ? 'border-red-300 ring-1 ring-red-200 dark:border-red-500/50 dark:ring-red-500/20'
          : 'border-slate-200 dark:border-slate-800',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 id={titleId} className="text-base font-semibold text-slate-900 dark:text-slate-50">
          {assignment.title}
        </h3>
        <StatusBadge status={status} />
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {assignment.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <DueDate dueDate={assignment.dueDate} now={now} overdue={overdue} showRelative={!submitted} />
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <UserRound aria-hidden="true" className="size-4" />
          {professorName}
        </span>
        <DriveLink href={assignment.driveLink} label="Open Drive link" />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        {submitted ? (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CircleCheck aria-hidden="true" className="size-4" />
            Submitted{submittedAt ? ` on ${formatTimestamp(submittedAt)}` : ''}
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Uploaded your work to the Drive link?
            </p>
            <Button
              variant="primary"
              size="sm"
              aria-label={`Yes, I have submitted ${assignment.title}`}
              onClick={() => onRequestSubmit(assignment.id)}
            >
              Yes, I have submitted
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
