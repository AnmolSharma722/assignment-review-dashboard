import { useMemo, useState } from 'react';
import { ClipboardList, SearchX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { FilterBar } from '../../components/assignments/FilterBar';
import { BackLink, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SORT_OPTIONS, STUDENT_FILTERS } from '../../constants';
import { useCurrentUser } from '../../context/AuthContext';
import { useReadyData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useNow } from '../../hooks/useNow';
import {
  findCourse,
  findUser,
  getAssignmentsForCourse,
  getGroupForStudent,
  getStudentAssignmentState,
  getStudentCourseSummary,
  matchesSearch,
  matchesStudentFilter,
  sortAssignments,
} from '../../lib/domain';
import { paths } from '../../lib/routes';
import type { SortKey, StudentFilter } from '../../types';
import { CourseNotFound } from '../common/CourseNotFound';
import { GroupDialog } from './GroupDialog';
import { GroupPanel } from './GroupPanel';
import { StudentAssignmentCard } from './StudentAssignmentCard';

export function StudentCoursePage() {
  const { courseId = '' } = useParams();
  const user = useCurrentUser();
  const { db, acknowledge } = useReadyData();
  const { toast } = useToast();
  const now = useNow();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StudentFilter>('all');
  const [sort, setSort] = useState<SortKey>('deadline-asc');
  /** Assignment awaiting the final confirmation dialog (step 2 of 2). */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  const course = findCourse(db, courseId);
  const enrolled = course !== undefined && course.enrolledStudentIds.includes(user.id);

  const items = useMemo(
    () =>
      enrolled
        ? getAssignmentsForCourse(db, courseId).map((assignment) => ({
            assignment,
            state: getStudentAssignmentState(db, assignment, user.id, now),
          }))
        : [],
    [db, courseId, enrolled, user.id, now],
  );

  const visible = useMemo(
    () =>
      sortAssignments(
        items.filter((i) => matchesSearch(i.assignment, search) && matchesStudentFilter(i.state.status, filter)),
        sort,
        (i) => i.assignment,
      ),
    [items, search, filter, sort],
  );

  if (!course || !enrolled) return <CourseNotFound backTo={paths.home('student')} />;

  const summary = getStudentCourseSummary(db, courseId, user.id, now);
  const group = getGroupForStudent(db, courseId, user.id);
  const professor = findUser(db, course.professorId);
  const confirming = items.find((i) => i.assignment.id === confirmingId);
  const hasActiveFilters = search.trim() !== '' || filter !== 'all';
  const remaining = summary.progress.total - summary.progress.done;

  function confirmAcknowledgement() {
    if (!confirming) return;
    const outcome = acknowledge(user.id, confirming.assignment.id);
    if (!outcome.ok) {
      toast(outcome.error, 'error');
    } else if (confirming.state.kind === 'group') {
      toast(`Acknowledged for ${confirming.state.group.name}. Every member can see it now.`);
    } else {
      toast(`“${confirming.assignment.title}” marked as submitted.`);
    }
    setConfirmingId(null);
  }

  return (
    <div className="space-y-6">
      <BackLink to={paths.home('student')}>All courses</BackLink>

      <PageHeader
        eyebrow={
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold tracking-wide text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            {course.code}
          </span>
        }
        title={course.name}
        description={`${professor?.name ?? 'Unknown professor'} · ${course.description}`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="progress-heading"
          className="animate-slide-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="progress-heading" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Your progress
              </h2>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {`${summary.progress.done} of ${summary.progress.total} submitted`}
              </p>
            </div>
            <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{summary.progress.percent}%</p>
          </div>
          <ProgressBar value={summary.progress.percent} label={`Your progress in ${course.name}`} className="mt-4" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {summary.assignmentCount === 0
              ? 'No assignments have been posted yet.'
              : remaining === 0
                ? 'All caught up. Nice work!'
                : `${remaining} left to submit`}
            {summary.overdue > 0 && (
              <span className="font-semibold text-red-700 dark:text-red-400"> · {summary.overdue} overdue</span>
            )}
          </p>
        </section>

        <GroupPanel db={db} group={group} currentUserId={user.id} onOpenDialog={() => setGroupDialogOpen(true)} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="When your professor posts an assignment for this course, it will show up here."
        />
      ) : (
        <>
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
            <ul className="grid gap-4 lg:grid-cols-2">
              {visible.map((item, index) => (
                <li key={item.assignment.id}>
                  <StudentAssignmentCard
                    assignment={item.assignment}
                    state={item.state}
                    now={now}
                    index={index}
                    onRequestAcknowledge={setConfirmingId}
                    onOpenGroupDialog={() => setGroupDialogOpen(true)}
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
            ? confirming.state.kind === 'group'
              ? `Confirm that ${confirming.state.group.name} has submitted “${confirming.assignment.title}”? Every member of your group will see this acknowledgement. It can't be undone.`
              : `Mark “${confirming.assignment.title}” as submitted? Only confirm if your work is already uploaded to the OneDrive link. This can't be undone.`
            : ''
        }
        confirmLabel="Confirm submission"
        onCancel={() => setConfirmingId(null)}
        onConfirm={confirmAcknowledgement}
      />

      <GroupDialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} course={course} />
    </div>
  );
}
