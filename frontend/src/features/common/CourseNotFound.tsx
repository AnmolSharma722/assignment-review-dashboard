import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonClass } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

/** Shown when a course doesn't exist or the signed-in user has no access to it. */
export function CourseNotFound({ backTo }: { backTo: string }) {
  return (
    <EmptyState
      icon={SearchX}
      title="Course not found"
      description="This course doesn't exist, or it isn't one of your courses."
      action={
        <Link to={backTo} className={buttonClass('primary')}>
          Back to my courses
        </Link>
      }
    />
  );
}
