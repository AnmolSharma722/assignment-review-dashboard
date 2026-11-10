import { User, Users } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { SubmissionType } from '../../types';

export function SubmissionTypeBadge({ type }: { type: SubmissionType }) {
  const group = type === 'group';
  const Icon = group ? Users : User;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        group
          ? 'bg-violet-50 text-violet-800 ring-violet-600/25 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30'
          : 'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/40',
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      <span className="sr-only">Submission type: </span>
      {group ? 'Group' : 'Individual'}
    </span>
  );
}
