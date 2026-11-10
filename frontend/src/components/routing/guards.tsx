import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { paths } from '../../lib/routes';
import type { Role } from '../../types';

/**
 * Protects a group of routes:
 *  - not signed in  -> /login (remembering where they were headed)
 *  - wrong role     -> their own dashboard (a student can't open /professor/...)
 *  - otherwise      -> the page, inside the app chrome
 */
export function RequireAuth({ role }: { role: Role }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to={paths.login} replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={paths.home(user.role)} replace />;

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

/** Login / register are only for signed-out visitors; signed-in users are sent to their dashboard. */
export function PublicOnly() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    const home = paths.home(user.role);
    return <Navigate to={from && from.startsWith(home) ? from : home} replace />;
  }
  return <Outlet />;
}

/** "/" sends each visitor to the right place. */
export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? paths.home(user.role) : paths.login} replace />;
}
