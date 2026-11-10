import { Crown, UsersRound } from 'lucide-react';
import { Avatar } from '../../components/layout/Avatar';
import { Button } from '../../components/ui/Button';
import { findUser, getGroupMembers } from '../../lib/domain';
import type { Database, Group } from '../../types';

interface GroupPanelProps {
  db: Database;
  group: Group | undefined;
  currentUserId: string;
  onOpenDialog: () => void;
}

/** Shows the student's group (members + leader), or a prompt to create / join one. */
export function GroupPanel({ db, group, currentUserId, onOpenDialog }: GroupPanelProps) {
  if (!group) {
    return (
      <section
        aria-labelledby="group-heading"
        className="flex h-full animate-slide-up flex-col justify-between gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <h2 id="group-heading" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <UsersRound aria-hidden="true" className="size-4" />
            Your group
          </h2>
          <p className="mt-2 text-lg font-semibold">You're not in a group</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Group assignments need a group. Create one, or join an existing group.
          </p>
        </div>
        <div>
          <Button variant="primary" onClick={onOpenDialog}>
            Create or join a group
          </Button>
        </div>
      </section>
    );
  }

  const members = getGroupMembers(db, group);
  const leader = findUser(db, group.leaderId);

  return (
    <section
      aria-labelledby="group-heading"
      className="h-full animate-slide-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="group-heading" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
        <UsersRound aria-hidden="true" className="size-4" />
        Your group
      </h2>
      <p className="mt-1 text-lg font-semibold">{group.name}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Leader: <span className="font-medium text-slate-800 dark:text-slate-200">{leader?.name ?? 'Unknown'}</span>
        {group.leaderId === currentUserId && ' (you)'}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Group members">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pr-3 pl-1 text-sm dark:bg-slate-800"
          >
            <Avatar name={member.name} size="sm" />
            <span>
              {member.name}
              {member.id === currentUserId && <span className="text-slate-500 dark:text-slate-400"> (you)</span>}
            </span>
            {member.id === group.leaderId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-bold text-amber-800 uppercase dark:bg-amber-500/20 dark:text-amber-300">
                <Crown aria-hidden="true" className="size-3" />
                Leader
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
