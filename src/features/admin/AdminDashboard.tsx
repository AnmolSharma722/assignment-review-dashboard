import { useMemo, useState } from 'react';
import { ClipboardList, Plus, SearchX } from 'lucide-react';
import { FilterBar } from '../../components/assignments/FilterBar';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Notice } from '../../components/ui/Notice';
import { ADMIN_FILTERS, SORT_OPTIONS } from '../../constants';
import { useCurrentUser } from '../../context/AuthContext';
import { useReadyData } from '../../context/DataContext';
import { useNotice } from '../../hooks/useNotice';
import { useNow } from '../../hooks/useNow';
import { isPastDue } from '../../lib/dates';
import {
  getAssignmentProgress,
  getAssignmentsForAdmin,
  getOverallProgress,
  getStudents,
  matchesAdminFilter,
  matchesSearch,
  sortAssignments,
} from '../../lib/domain';
import type { AdminFilter, Assignment, AssignmentInput, SortKey } from '../../types';
import { AdminAssignmentCard } from './AdminAssignmentCard';
import { AssignmentForm } from './AssignmentForm';

type FormState = { mode: 'create' } | { mode: 'edit'; assignment: Assignment } | null;

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function AdminDashboard() {
  const user = useCurrentUser();
  const { db, createAssignment, updateAssignment, deleteAssignment } = useReadyData();
  const now = useNow();
  const { notice, showNotice } = useNotice();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AdminFilter>('all');
  const [sort, setSort] = useState<SortKey>('due-asc');
  const [formState, setFormState] = useState<FormState>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);

  const students = useMemo(() => getStudents(db.users), [db.users]);

  // Admins only ever see the assignments they created.
  const mine = useMemo(() => getAssignmentsForAdmin(db, user.id), [db, user.id]);

  const overall = getOverallProgress(mine, db);
  const overdueIncomplete = mine.filter((a) => {
    const p = getAssignmentProgress(a, db);
    return isPastDue(a.dueDate, now) && p.done < p.total;
  }).length;

  const visible = useMemo(
    () =>
      sortAssignments(
        mine.filter(
          (a) =>
            matchesSearch(a, search) &&
            matchesAdminFilter(a, getAssignmentProgress(a, db), filter, now),
        ),
        sort,
        (a) => a,
      ),
    [mine, db, search, filter, sort, now],
  );

  const hasActiveFilters = search.trim() !== '' || filter !== 'all';

  function handleSave(input: AssignmentInput) {
    if (formState?.mode === 'edit') {
      updateAssignment(formState.assignment.id, input, user.id);
      showNotice('Assignment updated.');
    } else {
      createAssignment(input, user.id);
      showNotice('Assignment created.');
    }
    setFormState(null);
  }

  function handleDelete() {
    if (!deleting) return;
    deleteAssignment(deleting.id, user.id);
    showNotice(`“${deleting.title}” deleted.`);
    setDeleting(null);
  }

  const newButton = (
    <Button variant="primary" onClick={() => setFormState({ mode: 'create' })}>
      <Plus aria-hidden="true" className="size-4" />
      New assignment
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex animate-slide-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your assignments</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Create assignments and track how your class is doing.
          </p>
        </div>
        {mine.length > 0 && newButton}
      </div>

      {mine.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="You haven't created any assignments"
          description="Create your first assignment, add a Drive link, and choose which students receive it."
          action={newButton}
        />
      ) : (
        <>
          <section aria-label="Summary" className="grid animate-slide-up gap-3 sm:grid-cols-3">
            <StatTile label="Assignments" value={String(mine.length)} />
            <StatTile
              label="Average completion"
              value={`${overall.percent}%`}
              hint={`${overall.done} of ${overall.total} submissions received`}
            />
            <StatTile
              label="Past due & incomplete"
              value={String(overdueIncomplete)}
              hint={overdueIncomplete === 0 ? 'Nothing is behind' : 'Need follow-up'}
            />
          </section>

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            filterLabel="Filter assignments"
            filters={ADMIN_FILTERS}
            filter={filter}
            onFilterChange={setFilter}
            sortOptions={SORT_OPTIONS}
            sort={sort}
            onSortChange={setSort}
          />

          <p className="sr-only" aria-live="polite">
            {`${visible.length} ${visible.length === 1 ? 'assignment' : 'assignments'} shown`}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No assignments match"
              description="Try a different search term or filter."
              action={
                hasActiveFilters ? (
                  <Button
                    onClick={() => {
                      setSearch('');
                      setFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-4">
              {visible.map((assignment, index) => (
                <li key={assignment.id}>
                  <AdminAssignmentCard
                    assignment={assignment}
                    students={students}
                    submissions={db.submissions}
                    now={now}
                    index={index}
                    onEdit={(a) => setFormState({ mode: 'edit', assignment: a })}
                    onDelete={setDeleting}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal
        open={formState !== null}
        onClose={() => setFormState(null)}
        title={formState?.mode === 'edit' ? 'Edit assignment' : 'Create assignment'}
        description="Students will see this on their dashboard, with a link to submit their work."
        size="lg"
      >
        {/* `key` resets the form's state whenever a different assignment is opened. */}
        {formState && (
          <AssignmentForm
            key={formState.mode === 'edit' ? formState.assignment.id : 'new'}
            initial={formState.mode === 'edit' ? formState.assignment : undefined}
            students={students}
            onSubmit={handleSave}
            onCancel={() => setFormState(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        tone="danger"
        title="Delete assignment?"
        description={
          deleting
            ? `“${deleting.title}” and all of its submission records will be permanently removed.`
            : ''
        }
        confirmLabel="Delete assignment"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      <Notice message={notice} />
    </div>
  );
}
