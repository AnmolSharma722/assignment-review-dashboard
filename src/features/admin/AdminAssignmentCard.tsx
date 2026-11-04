import { useId, useState } from 'react';
import { ChevronDown, Pencil, Trash2, Users } from 'lucide-react';
import { DriveLink } from '../../components/assignments/DriveLink';
import { DueDate } from '../../components/assignments/DueDate';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cn } from '../../lib/cn';
import { isPastDue } from '../../lib/dates';
import {
  calcProgress,
  findSubmission,
  getAssignedStudents,
  getStudentStatus,
} from '../../lib/domain';
import type { Assignment, Submission, User } from '../../types';
import { StudentStatusList, type StudentRow } from './StudentStatusList';

interface AdminAssignmentCardProps {
  assignment: Assignment;
  /** All students in the system (the card works out who is assigned). */
  students: User[];
  submissions: Submission[];
  now: Date;
  index: number;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
}

export function AdminAssignmentCard({
  assignment,
  students,
  submissions,
  now,
  index,
  onEdit,
  onDelete,
}: AdminAssignmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const titleId = useId();
  const panelId = useId();

  const assigned = getAssignedStudents(assignment, students);
  const rows: StudentRow[] = assigned.map((student) => ({
    student,
    status: getStudentStatus(assignment, student.id, submissions, now),
    submittedAt: findSubmission(submissions, assignment.id, student.id)?.submittedAt,
  }));
  const progress = calcProgress(rows.filter((r) => r.status === 'submitted').length, rows.length);
  const pastDue = isPastDue(assignment.dueDate, now);
  const incomplete = progress.done < progress.total;
  const highlightOverdue = pastDue && incomplete;

  const audience =
    assignment.assignedTo === 'all'
      ? `All students (${assigned.length})`
      : `${assigned.length} selected ${assigned.length === 1 ? 'student' : 'students'}`;

  return (
    <article
      aria-labelledby={titleId}
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className={cn(
        'animate-slide-up rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900',
        highlightOverdue
          ? 'border-red-300 ring-1 ring-red-200 dark:border-red-500/50 dark:ring-red-500/20'
          : 'border-slate-200 dark:border-slate-800',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id={titleId} className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {assignment.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {assignment.description}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={() => onEdit(assignment)} aria-label={`Edit ${assignment.title}`}>
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
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
        <DueDate dueDate={assignment.dueDate} now={now} overdue={highlightOverdue} showRelative={incomplete} />
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <Users aria-hidden="true" className="size-4" />
          {audience}
        </span>
        <DriveLink href={assignment.driveLink} label="Drive link" />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium text-slate-800 dark:text-slate-200">Class completion</span>
          <span className="text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {`${progress.done} of ${progress.total} submitted`}
            </span>{' '}
            · {progress.percent}%
          </span>
        </div>
        <ProgressBar value={progress.percent} label={`Class completion for ${assignment.title}`} />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${expanded ? 'Hide' : 'View'} student status for ${assignment.title}`}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300"
        >
          {expanded ? 'Hide student status' : 'View student status'}
          <ChevronDown
            aria-hidden="true"
            className={cn('size-4 transition-transform', expanded && 'rotate-180')}
          />
        </button>
        <div id={panelId} hidden={!expanded} className="mt-2">
          {expanded && <StudentStatusList rows={rows} />}
        </div>
      </div>
    </article>
  );
}
