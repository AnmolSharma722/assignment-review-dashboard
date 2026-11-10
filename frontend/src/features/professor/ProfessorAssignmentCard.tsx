import { useId, useState } from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Deadline } from '../../components/assignments/Deadline';
import { OneDriveLink } from '../../components/assignments/OneDriveLink';
import { SubmissionTypeBadge } from '../../components/assignments/SubmissionTypeBadge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cn } from '../../lib/cn';
import { isPastDeadline } from '../../lib/dates';
import type { AssignmentTracking } from '../../lib/domain';
import type { Assignment } from '../../types';
import { TrackingList } from './TrackingList';

interface ProfessorAssignmentCardProps {
  assignment: Assignment;
  tracking: AssignmentTracking;
  now: Date;
  index: number;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
}

export function ProfessorAssignmentCard({
  assignment,
  tracking,
  now,
  index,
  onEdit,
  onDelete,
}: ProfessorAssignmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const titleId = useId();
  const panelId = useId();

  const { progress } = tracking;
  const incomplete = progress.done < progress.total;
  const highlightOverdue = isPastDeadline(assignment.deadline, now) && incomplete;
  const noun = tracking.unit === 'group' ? 'groups' : 'students';

  return (
    <article
      aria-labelledby={titleId}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className={cn(
        'animate-slide-up rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900',
        highlightOverdue
          ? 'border-red-300 ring-1 ring-red-200 dark:border-red-500/50 dark:ring-red-500/20'
          : 'border-slate-200 dark:border-slate-800',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={titleId} className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {assignment.title}
            </h3>
            <SubmissionTypeBadge type={assignment.submissionType} />
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{assignment.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={() => onEdit(assignment)} aria-label={`Edit ${assignment.title}`}>
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => onDelete(assignment)}
            aria-label={`Delete ${assignment.title}`}
            className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Deadline deadline={assignment.deadline} now={now} overdue={highlightOverdue} showRelative={incomplete} />
        <OneDriveLink href={assignment.oneDriveLink} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
          <span className="font-medium text-slate-800 dark:text-slate-200">Submission progress</span>
          <span className="text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {`${progress.done} of ${progress.total} ${noun} submitted`}
            </span>{' '}
            · {progress.percent}%
          </span>
        </div>
        <ProgressBar value={progress.percent} label={`Submission progress for ${assignment.title}`} />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${expanded ? 'Hide' : 'View'} submissions for ${assignment.title}`}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300"
        >
          {expanded ? 'Hide submissions' : 'View submissions'}
          <ChevronDown
            aria-hidden="true"
            className={cn('size-4 transition-transform duration-200', expanded && 'rotate-180')}
          />
        </button>
        <div id={panelId} hidden={!expanded} className="mt-2">
          {expanded && <TrackingList tracking={tracking} />}
        </div>
      </div>
    </article>
  );
}
