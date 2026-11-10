import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../../components/layout/ThemeToggle';
import { buttonClass } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { paths } from '../../lib/routes';

/** Fallback for unknown URLs. */
export function NotFoundPage() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex justify-end p-3 sm:p-4">
        <ThemeToggle />
      </div>
      <main id="main" className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 pb-16">
        <div className="w-full">
          <EmptyState
            icon={Compass}
            title="Page not found"
            description="The page you're looking for doesn't exist or has moved."
            action={
              <Link to={user ? paths.home(user.role) : paths.login} className={buttonClass('primary')}>
                {user ? 'Go to my dashboard' : 'Go to sign in'}
              </Link>
            }
          />
        </div>
      </main>
    </div>
  );
}
