import { Route, Routes } from 'react-router-dom';
import { HomeRedirect, PublicOnly, RequireAuth } from './components/routing/guards';
import { Button } from './components/ui/Button';
import { ErrorState } from './components/ui/ErrorState';
import { Spinner } from './components/ui/Spinner';
import { AuthProvider } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { NotFoundPage } from './features/common/NotFoundPage';
import { ProfessorCoursePage } from './features/professor/ProfessorCoursePage';
import { ProfessorDashboard } from './features/professor/ProfessorDashboard';
import { StudentCoursePage } from './features/student/StudentCoursePage';
import { StudentDashboard } from './features/student/StudentDashboard';

/** Decides what to show: loading -> error -> routes. */
function Shell() {
  const { status, error, reload, resetDemoData } = useData();

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

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth role="professor" />}>
        <Route path="/professor" element={<ProfessorDashboard />} />
        <Route path="/professor/courses/:courseId" element={<ProfessorCoursePage />} />
      </Route>

      <Route element={<RequireAuth role="student" />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/courses/:courseId" element={<StudentCoursePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

/** Providers + routes. The router itself is supplied by main.tsx (or by tests). */
export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DataProvider>
          <AuthProvider>
            <Shell />
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
