import { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { CourseCard } from '../../components/courses/CourseCard';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useCurrentUser } from '../../context/AuthContext';
import { useReadyData } from '../../context/DataContext';
import { useNow } from '../../hooks/useNow';
import {
  countNeedingAttention,
  getAssignmentsForCourse,
  getCourseCompletion,
  getCoursesForProfessor,
} from '../../lib/domain';
import { firstName } from '../../lib/names';
import { paths } from '../../lib/routes';
import { CourseFormModal } from './CourseFormModal';

export function ProfessorDashboard() {
  const user = useCurrentUser();
  const { db } = useReadyData();
  const now = useNow();
  const [creating, setCreating] = useState(false);

  const courses = getCoursesForProfessor(db, user.id);

  const newCourse = (
    <Button variant="primary" onClick={() => setCreating(true)}>
      <Plus aria-hidden="true" className="size-4" />
      New course
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your courses"
        description={`Welcome back, ${firstName(user.name)}. Open a course to manage its assignments and track submissions.`}
        actions={courses.length > 0 ? newCourse : undefined}
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You aren't teaching any courses yet"
          description="Create your first course. Students can then enroll in it and you can start adding assignments."
          action={newCourse}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => {
            const completion = getCourseCompletion(db, course.id, now);
            const attention = countNeedingAttention(db, course.id, now);
            const assignmentCount = getAssignmentsForCourse(db, course.id).length;
            return (
              <li key={course.id}>
                <CourseCard
                  course={course}
                  to={paths.course('professor', course.id)}
                  subtitle={`${course.enrolledStudentIds.length} ${course.enrolledStudentIds.length === 1 ? 'student' : 'students'} enrolled`}
                  index={index}
                >
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'}
                      </span>
                      <span className="font-semibold">{completion.percent}% complete</span>
                    </div>
                    <ProgressBar
                      value={completion.percent}
                      size="sm"
                      label={`Overall completion for ${course.name}`}
                    />
                    {attention > 0 && (
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                        {attention} past deadline with missing submissions
                      </p>
                    )}
                  </div>
                </CourseCard>
              </li>
            );
          })}
        </ul>
      )}

      <CourseFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
