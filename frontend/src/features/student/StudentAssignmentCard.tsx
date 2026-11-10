import { useId } from 'react';
import { CircleCheck, Hourglass, TriangleAlert } from 'lucide-react';
import { Deadline } from '../../components/assignments/Deadline';
import { OneDriveLink } from '../../components/assignments/OneDriveLink';
import { SubmissionTypeBadge } from '../../components/assignments/SubmissionTypeBadge';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { cn } from '../../lib/cn';
import { formatDateTime } from '../../lib/dates';
import { wasLate, type StudentAssignmentState } from '../../lib/domain';
import type { Assignment } from '../../types';

interface StudentAssignmentCardProps {
  assignment: Assignment;
  state: StudentAssignmentState;
  now: Date;
  /** Position in the list, used to stagger the entrance animation. */
  index: number;
  /** Step 1 of the two-step flow: opens the final confirmation dialog. */
  onRequestAcknowledge: (assignmentId: string) => void;
  onOpenGroupDialog: () => void;
}

function Acknowledged({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
      <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function StudentAssignmentCard({
  assignment,
  state,
  now,
  index,
  onRequestAcknowledge,
  onOpenGroupDialog,
}: StudentAssignmentCardProps) {
  const titleId = useId();
  const overdue = state.status === 'overdue';
  const submitted = state.status === 'submitted';

  let footer: React.ReactNode;

  if (state.kind === 'no-group') {
    footer = (
      <div className="flex flex-col gap-3 rounded-xl bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-500/10">
        <p className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          You are not part of any group. Create or join one to submit this assignment.
        </p>
        <Button variant="primary" size="sm" onClick={onOpenGroupDialog}>
          Create or join a group
        </Button>
      </div>
    );
  } else if (state.acknowledgement) {
    const when = formatDateTime(state.acknowledgement.acknowledgedAt);
    const late = wasLate(state.acknowledgement, assignment) ? ' (submitted late)' : '';
    footer =
      state.kind === 'group' ? (
        <Acknowledged>
          Acknowledged by {state.acknowledgedBy?.name ?? state.leader?.name ?? 'the group leader'} on {when}
          {late}
        </Acknowledged>
      ) : (
        <Acknowledged>
          Acknowledged on {when}
          {late}
        </Acknowledged>
      );
  } else if (state.kind === 'group' && !state.isLeader) {
    footer = (
      <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Hourglass aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          Waiting for <span className="font-semibold">{state.leader?.name ?? 'your group leader'}</span>, your group
          leader, to acknowledge this submission.
        </span>
      </p>
    );
  } else {
    const isGroup = state.kind === 'group';
    footer = (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isGroup
            ? 'As group leader, you confirm for your whole group. Has everything been uploaded?'
            : 'Uploaded your work to the OneDrive link?'}
        </p>
        <Button
          variant="primary"
          size="sm"
          aria-label={`${isGroup ? 'Yes, our group has submitted' : 'Yes, I have submitted'}: ${assignment.title}`}
          onClick={() => onRequestAcknowledge(assignment.id)}
        >
          {isGroup ? 'Yes, our group has submitted' : 'Yes, I have submitted'}
        </Button>
      </div>
    );
  }

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
        <StatusBadge status={state.status} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SubmissionTypeBadge type={assignment.submissionType} />
        {state.kind === 'group' && (
          <span className="text-xs text-slate-500 dark:text-slate-400">Group: {state.group.name}</span>
        )}
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{assignment.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Deadline deadline={assignment.deadline} now={now} overdue={overdue} showRelative={!submitted} />
        <OneDriveLink href={assignment.oneDriveLink} />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">{footer}</div>
    </article>
  );
}
