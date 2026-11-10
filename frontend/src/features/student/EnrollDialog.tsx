import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useCurrentUser } from '../../context/AuthContext';
import { useReadyData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { findUser, getJoinableCourses } from '../../lib/domain';

/** Lists the courses a student isn't enrolled in yet, with an Enroll button on each. */
export function EnrollDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useCurrentUser();
  const { db, enrollStudent } = useReadyData();
  const { toast } = useToast();

  const joinable = getJoinableCourses(db, user.id);

  function enroll(courseId: string, courseName: string) {
    const outcome = enrollStudent(courseId, user.id);
    if (!outcome.ok) return toast(outcome.error, 'error');
    toast(`You're now enrolled in ${courseName}.`);
    if (joinable.length === 1) onClose(); // that was the last one
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enroll in a course"
      description="Pick the courses you're taking this semester."
    >
      {joinable.length === 0 ? (
        <p className="py-4 text-sm text-slate-600 dark:text-slate-400" data-autofocus="" tabIndex={-1}>
          You're enrolled in every available course.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {joinable.map((course) => (
            <li key={course.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  <span className="mr-2 text-xs font-bold text-slate-500 dark:text-slate-400">{course.code}</span>
                  {course.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {findUser(db, course.professorId)?.name ?? 'Unknown professor'}
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                aria-label={`Enroll in ${course.name}`}
                onClick={() => enroll(course.id, course.name)}
              >
                Enroll
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end pt-3">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
