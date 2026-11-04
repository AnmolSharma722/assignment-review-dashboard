import { Avatar } from '../../components/layout/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatTimestamp } from '../../lib/dates';
import type { StudentStatus, User } from '../../types';

export interface StudentRow {
  student: User;
  status: StudentStatus;
  submittedAt?: string;
}

/** Every assigned student's submission status for one assignment. */
export function StudentStatusList({ rows }: { rows: StudentRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-600 dark:text-slate-400">No students are assigned.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {rows.map(({ student, status, submittedAt }) => (
        <li key={student.id} className="flex items-center gap-3 py-2.5">
          <Avatar name={student.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{student.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {submittedAt ? `Submitted on ${formatTimestamp(submittedAt)}` : student.email}
            </p>
          </div>
          <StatusBadge status={status} label={status === 'submitted' ? 'Submitted' : 'Not submitted'} />
        </li>
      ))}
    </ul>
  );
}
