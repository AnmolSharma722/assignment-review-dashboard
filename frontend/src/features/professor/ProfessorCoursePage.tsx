import { useMemo, useState } from 'react';
import { ClipboardList, Plus, SearchX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { FilterBar } from '../../components/assignments/FilterBar';
import { BackLink, PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { StatTile } from '../../components/ui/StatTile';
import { PROFESSOR_FILTERS, SORT_OPTIONS } from '../../constants';
import { useCurrentUser } from '../../context/AuthContext';
import { useReadyData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useNow } from '../../hooks/useNow';
import { isPastDeadline } from '../../lib/dates';
import {
  calcProgress,
  findCourse,
  getAssignmentTracking,
  getAssignmentsForCourse,
  matchesProfessorFilter,
  matchesSearch,
  sortAssignments,
} from '../../lib/domain';
import { paths } from '../../lib/routes';
import type { Assignment, AssignmentInput, ProfessorFilter, SortKey } from '../../types';
import { CourseNotFound } from '../common/CourseNotFound';
import { AssignmentForm } from './AssignmentForm';
import { ProfessorAssignmentCard } from './ProfessorAssignmentCard';

type FormState = { mode: 'create' } | { mode: 'edit'; assignment: Assignment } | null;

export function ProfessorCoursePage() {
  const { courseId = '' } = useParams();
  const user = useCurrentUser();
  const { db, createAssignment, updateAssignment, deleteAssignment } = useReadyData();
  const { toast } = useToast();
  const now = useNow();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProfessorFilter>('all');
  const [sort, setSort] = useState<SortKey>('deadline-asc');
  const [formState, setFormState] = useState<FormState>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);

  const course = findCourse(db, courseId);
  const owned = course !== undefined && course.professorId === user.id;

  // Each assignment together with its live tracking numbers.
  const items = useMemo(
    () =>
      owned
        ? getAssignmentsForCourse(db, courseId).map((assignment) => ({
            assignment,
            tracking: getAssignmentTracking(db, assignment, now),
          }))
        : [],
    [db, courseId, owned, now],
  );

  const visible = useMemo(
    () =>
      sortAssignments(
        items.filter(
          (i) =>
            matchesSearch(i.assignment, search) &&
            matchesProfessorFilter(i.assignment, i.tracking.progress, filter, now),
        ),
        sort,
        (i) => i.assignment,
      ),
    [items, search, filter, sort, now],
  );

  if (!course || !owned) return <CourseNotFound backTo={paths.home('professor')} />;

  const overall = calcProgress(
    items.reduce((sum, i) => sum + i.tracking.progress.done, 0),
    items.reduce((sum, i) => sum + i.tracking.progress.total, 0),
  );
  const needAttention = items.filter(
    (i) => isPastDeadline(i.assignment.deadline, now) && i.tracking.progress.done < i.tracking.progress.total,
  ).length;
  const hasActiveFilters = search.trim() !== '' || filter !== 'all';

  function handleSave(input: AssignmentInput) {
    if (formState?.mode === 'edit') {
      const outcome = updateAssignment(user.id, formState.assignment.id, input);
      if (!outcome.ok) return toast(outcome.error, 'error');
      toast('Assignment updated.');
    } else {
      const outcome = createAssignment(user.id, courseId, input);
      if (!outcome.ok) return toast(outcome.error, 'error');
      toast('Assignment created.');
    }
    setFormState(null);
  }

  function handleDelete() {
    if (!deleting) return;
    const outcome = deleteAssignment(user.id, deleting.id);
    if (!outcome.ok) toast(outcome.error, 'error');
    else toast(`“${deleting.title}” deleted.`);
    setDeleting(null);
  }

  const editingHasAcks =
    formState?.mode === 'edit' &&
    db.acknowledgements.some((a) => a.assignmentId === formState.assignment.id);

  const newButton = (
    <Button variant="primary" onClick={() => setFormState({ mode: 'create' })}>
      <Plus aria-hidden="true" className="size-4" />
      New assignment
    </Button>
  );

  return (
    <div className="space-y-6">
      <BackLink to={paths.home('professor')}>All courses</BackLink>

      <PageHeader
        eyebrow={
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold tracking-wide text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            {course.code}
          </span>
        }
        title={course.name}
        description={course.description}
        actions={items.length > 0 ? newButton : undefined}
      />

      <section aria-label="Course summary" className="grid animate-slide-up gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Assignments" value={String(items.length)} />
        <StatTile label="Students enrolled" value={String(course.enrolledStudentIds.length)} />
        <StatTile
          label="Overall completion"
          value={`${overall.percent}%`}
          hint={`${overall.done} of ${overall.total} submissions received`}
        />
        <StatTile
          label="Past deadline & incomplete"
          value={String(needAttention)}
          hint={needAttention === 0 ? 'Nothing is behind' : 'Need follow-up'}
        />
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments in this course yet"
          description="Create the first one: add a deadline, a OneDrive link, and choose individual or group submission."
          action={newButton}
        />
      ) : (
        <>
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            filterLabel="Filter assignments"
            filters={PROFESSOR_FILTERS}
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
              {visible.map(({ assignment, tracking }, index) => (
                <li key={assignment.id}>
                  <ProfessorAssignmentCard
                    assignment={assignment}
                    tracking={tracking}
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
        description={`For ${course.code} · ${course.name}. Students see this on their course page.`}
        size="lg"
      >
        {formState && (
          <AssignmentForm
            key={formState.mode === 'edit' ? formState.assignment.id : 'new'}
            initial={formState.mode === 'edit' ? formState.assignment : undefined}
            typeLocked={editingHasAcks}
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
          deleting ? `“${deleting.title}” and all of its submission records will be permanently removed.` : ''
        }
        confirmLabel="Delete assignment"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
