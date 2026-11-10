import { useMemo, useState } from 'react';
import { Inbox, SearchX } from 'lucide-react';
import { FilterBar } from '../../components/assignments/FilterBar';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Notice } from '../../components/ui/Notice';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SORT_OPTIONS, STUDENT_FILTERS } from '../../constants';
import { useCurrentUser } from '../../context/AuthContext';
import { useReadyData } from '../../context/DataContext';
import { useNotice } from '../../hooks/useNotice';
import { useNow } from '../../hooks/useNow';
import {
  calcProgress,
  findSubmission,
  getAssignmentsForStudent,
  getStudentStatus,
  matchesSearch,
  matchesStudentFilter,
  sortAssignments,
} from '../../lib/domain';
import type { SortKey, StudentFilter } from '../../types';
import { AssignmentCard } from './AssignmentCard';

export function StudentDashboard() {
  const user = useCurrentUser();
  const { db, submitAssignment } = useReadyData();
  const now = useNow();
  const { notice, showNotice } = useNotice();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StudentFilter>('all');
  const [sort, setSort] = useState<SortKey>('due-asc');
  /** Assignment awaiting the final confirmation dialog (step 2 of 2). */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const professorNames = useMemo(
    () => new Map(db.users.map((u) => [u.id, u.name])),
    [db.users],
  );

  // Only assignments assigned to this student, each with its derived status.
  const items = useMemo(
    () =>
      getAssignmentsForStudent(db, user.id).map((assignment) => ({
        assignment,
        status: getStudentStatus(assignment, user.id, db.submissions, now),
        submittedAt: findSubmission(db.submissions, assignment.id, user.id)?.submittedAt,
      })),
    [db, user.id, now],
  );

  const progress = calcProgress(items.filter((i) => i.status === 'submitted').length, items.length);
  const overdueCount = items.filter((i) => i.status === 'overdue').length;

  const visible = useMemo(
    () =>
      sortAssignments(
        items.filter(
          (i) => matchesSearch(i.assignment, search) && matchesStudentFilter(i.status, filter),
        ),
        sort,
        (i) => i.assignment,
      ),
    [items, search, filter, sort],
  );

  const confirming = items.find((i) => i.assignment.id === confirmingId);
  const hasActiveFilters = search.trim() !== '' || filter !== 'all';
  const firstName = user.name.split(' ')[0];

  function clearFilters() {
    setSearch('');
    setFilter('all');
  }

  function confirmSubmission() {
    if (!confirming) return;
    submitAssignment(confirming.assignment.id, user.id);
    showNotice(`“${confirming.assignment.title}” marked as submitted.`);
    setConfirmingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Here are the assignments your professors have set for you.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No assignments yet"
          description="When a professor assigns work to you, it will show up here."
        />
      ) : (
        <>
          <section
            aria-labelledby="progress-heading"
            className="animate-slide-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="progress-heading" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Overall progress
                </h2>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {`${progress.done} of ${progress.total} submitted`}
                </p>
              </div>
              <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                {progress.percent}%
              </p>
            </div>
            <ProgressBar value={progress.percent} label="Overall assignment progress" className="mt-4" />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {progress.total - progress.done === 0
                ? 'All caught up. Nice work!'
                : `${progress.total - progress.done} left to submit`}
              {overdueCount > 0 && (
                <span className="font-semibold text-red-700 dark:text-red-400">
                  {' '}
                  · {overdueCount} overdue
                </span>
              )}
            </p>
          </section>

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            filterLabel="Filter by status"
            filters={STUDENT_FILTERS}
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
              description="Try a different search term or status filter."
              action={
                hasActiveFilters ? (
                  <Button onClick={clearFilters}>Clear filters</Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {visible.map((item, index) => (
                <li key={item.assignment.id}>
                  <AssignmentCard
                    assignment={item.assignment}
                    professorName={professorNames.get(item.assignment.createdBy) ?? 'Unknown professor'}
                    status={item.status}
                    submittedAt={item.submittedAt}
                    now={now}
                    index={index}
                    onRequestSubmit={setConfirmingId}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirming !== undefined}
        title="Final confirmation"
        description={
          confirming
            ? `Mark “${confirming.assignment.title}” as submitted? Only confirm if your work is already uploaded to the Drive link. This can't be undone.`
            : ''
        }
        confirmLabel="Confirm submission"
        onCancel={() => setConfirmingId(null)}
        onConfirm={confirmSubmission}
      />

      <Notice message={notice} />
    </div>
  );
}
