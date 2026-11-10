import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, describedBy, inputClass } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { useCurrentUser } from '../../context/AuthContext';
import { useReadyData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { findUser, getGroupMembers, getGroupsForCourse } from '../../lib/domain';
import { validateGroupName } from '../../lib/validation';
import type { Course } from '../../types';

interface GroupDialogProps {
  open: boolean;
  onClose: () => void;
  course: Course;
}

function GroupDialogBody({ course, onClose }: { course: Course; onClose: () => void }) {
  const user = useCurrentUser();
  const { db, createGroup, joinGroup } = useReadyData();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const groups = getGroupsForCourse(db, course.id);
  const nameError = (attempted ? validateGroupName(name) : undefined) ?? serverError ?? undefined;

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setServerError(null);
    if (validateGroupName(name)) {
      document.getElementById('group-name')?.focus();
      return;
    }
    const outcome = createGroup(user.id, course.id, name);
    if (!outcome.ok) {
      setServerError(outcome.error);
      document.getElementById('group-name')?.focus();
      return;
    }
    toast(`Group “${outcome.group.name}” created. You are its leader.`);
    onClose();
  }

  function handleJoin(groupId: string, groupName: string) {
    const outcome = joinGroup(user.id, groupId);
    if (!outcome.ok) return toast(outcome.error, 'error');
    toast(`You joined ${groupName}.`);
    onClose();
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="create-group-heading">
        <h3 id="create-group-heading" className="text-sm font-semibold">
          Create a new group
        </h3>
        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
          You become the group leader, and only the leader can acknowledge group assignments.
        </p>
        <form onSubmit={handleCreate} noValidate className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Field id="group-name" label="Group name" required error={nameError}>
              <input
                id="group-name"
                type="text"
                data-autofocus=""
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-required="true"
                className={inputClass(!!nameError)}
                {...describedBy('group-name', nameError)}
              />
            </Field>
          </div>
          <Button type="submit" variant="primary" className="sm:mt-[1.7rem]">
            Create group
          </Button>
        </form>
      </section>

      <section aria-labelledby="join-group-heading">
        <h3 id="join-group-heading" className="text-sm font-semibold">
          Or join an existing group
        </h3>
        {groups.length === 0 ? (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
            There are no groups in this course yet. Create the first one above.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {groups.map((group) => {
              const members = getGroupMembers(db, group);
              return (
                <li key={group.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{group.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Leader: {findUser(db, group.leaderId)?.name ?? 'Unknown'} · {members.length}{' '}
                      {members.length === 1 ? 'member' : 'members'}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {members.map((m) => m.name).join(', ')}
                    </p>
                  </div>
                  <Button size="sm" aria-label={`Join ${group.name}`} onClick={() => handleJoin(group.id, group.name)}>
                    Join
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Create a group (and become its leader) or join an existing one. */
export function GroupDialog({ open, onClose, course }: GroupDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create or join a group"
      description={`Groups in ${course.code} · ${course.name}. You can be in one group per course.`}
      size="md"
    >
      <GroupDialogBody course={course} onClose={onClose} />
    </Modal>
  );
}
