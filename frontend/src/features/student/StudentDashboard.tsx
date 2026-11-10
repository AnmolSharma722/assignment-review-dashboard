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
import { findUser, getCoursesForStudent, getStudentCourseSummary } from '../../lib/domain';
import { firstName } from '../../lib/names';
import { paths } from '../../lib/routes';
import { EnrollDialog } from './EnrollDialog';

export function StudentDashboard() {
  const user = useCurrentUser();
  const { db } = useReadyData();
  const now = useNow();
  const [enrolling, setEnrolling] = useState(false);

  const courses = getCoursesForStudent(db, user.id);

  const enrollButton = (
    <Button variant="primary" onClick={() => setEnrolling(true)}>
      <Plus aria-hidden="true" className="size-4" />
      Enroll in a course
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your courses"
        description={`Welcome back, ${firstName(user.name)}. Here are the courses you're enrolled in this semester.`}
        actions={courses.length > 0 ? enrollButton : undefined}
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You aren't enrolled in any courses yet"
          description="Enroll in a course to see its assignments, join a group and submit your work."
          action={enrollButton}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => {
            const summary = getStudentCourseSummary(db, course.id, user.id, now);
            const professor = findUser(db, course.professorId);
            return (
              <li key={course.id}>
                <CourseCard
                  course={course}
                  to={paths.course('student', course.id)}
                  subtitle={professor?.name}
                  index={index}
                >
                  {summary.assignmentCount === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No assignments yet</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-semibold">
                          {`${summary.progress.done} of ${summary.progress.total} submitted`}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">{summary.progress.percent}%</span>
                      </div>
                      <ProgressBar
                        value={summary.progress.percent}
                        size="sm"
                        label={`Your progress in ${course.name}`}
                      />
                      {summary.overdue > 0 && (
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                          {summary.overdue} overdue
                        </p>
                      )}
                    </div>
                  )}
                </CourseCard>
              </li>
            );
          })}
        </ul>
      )}

      <EnrollDialog open={enrolling} onClose={() => setEnrolling(false)} />
    </div>
  );
}
