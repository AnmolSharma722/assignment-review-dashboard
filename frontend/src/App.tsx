import { AppLayout } from './components/layout/AppLayout';
import { Button } from './components/ui/Button';
import { ErrorState } from './components/ui/ErrorState';
import { Spinner } from './components/ui/Spinner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { LoginPage } from './features/auth/LoginPage';
import { StudentDashboard } from './features/student/StudentDashboard';

/** Decides what to show: loading -> error -> login -> role dashboard. */
function Shell() {
  const { status, error, reload, resetDemoData } = useData();
  const { user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-400">
        <Spinner size="lg" label="Loading dashboard" />
        <p className="text-sm" aria-hidden="true">
          Loading your dashboard…
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-dvh items-center px-4">
        <ErrorState
          title="We couldn't load your data"
          message={error ?? 'Something went wrong.'}
          actions={
            <>
              <Button variant="primary" onClick={reload}>
                Try again
              </Button>
              <Button onClick={resetDemoData}>Reset demo data</Button>
            </>
          }
        />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppLayout>{user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />}</AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
