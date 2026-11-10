import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Avatar } from '../../components/layout/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { cn } from '../../lib/cn';
import { formatDateTime } from '../../lib/dates';
import type { AssignmentTracking, TrackingRow } from '../../lib/domain';

type RowFilter = 'all' | 'submitted' | 'not-submitted';

const FILTERS: { value: RowFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'not-submitted', label: 'Not submitted' },
];

function Row({ row }: { row: TrackingRow }) {
  const submitted = row.status === 'submitted';
  const isGroup = row.kind === 'group';

  let detail: string;
  if (submitted && row.acknowledgedAt) {
    detail = isGroup
      ? `Acknowledged by ${row.acknowledgedBy?.name ?? 'the leader'} on ${formatDateTime(row.acknowledgedAt)}`
      : `Acknowledged on ${formatDateTime(row.acknowledgedAt)}`;
  } else {
    detail = isGroup ? 'Waiting for the group leader to acknowledge' : 'Not acknowledged yet';
  }

  return (
    <li className="flex items-start gap-3 py-3">
      <Avatar name={row.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>
        {isGroup && row.members && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Leader: <span className="font-medium text-slate-700 dark:text-slate-300">{row.leader?.name ?? 'Unknown'}</span>
            {' · '}
            Members: {row.members.map((m) => m.name).join(', ')}
          </p>
        )}
      </div>
      <StatusBadge status={row.status} label={submitted ? 'Submitted' : 'Not submitted'} />
    </li>
  );
}

/** The drill-down: who has submitted and who hasn't (students, or groups for group assignments). */
export function TrackingList({ tracking }: { tracking: AssignmentTracking }) {
  const [filter, setFilter] = useState<RowFilter>('all');
  const noun = tracking.unit === 'group' ? 'groups' : 'students';

  const visible = tracking.rows.filter((row) =>
    filter === 'all' ? true : filter === 'submitted' ? row.status === 'submitted' : row.status !== 'submitted',
  );

  return (
    <div>
      {tracking.rows.length > 0 && (
        <div role="group" aria-label={`Filter ${noun}`} className="mb-1 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                filter === f.value
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {tracking.rows.length === 0 ? (
        <p className="py-3 text-sm text-slate-600 dark:text-slate-400">
          {tracking.unit === 'group'
            ? 'No groups have been created in this course yet.'
            : 'No students are enrolled in this course yet.'}
        </p>
      ) : visible.length === 0 ? (
        <p className="py-3 text-sm text-slate-600 dark:text-slate-400">No {noun} in this view.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {visible.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </ul>
      )}

      {tracking.ungroupedStudents.length > 0 && (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            {tracking.ungroupedStudents.length} {tracking.ungroupedStudents.length === 1 ? 'student is' : 'students are'} not
            in a group yet and can't submit: {tracking.ungroupedStudents.map((s) => s.name).join(', ')}.
          </span>
        </p>
      )}
    </div>
  );
}
