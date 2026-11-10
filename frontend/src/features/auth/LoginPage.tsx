import { useState, type FormEvent } from 'react';
import { CircleAlert, Info, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field, describedBy, inputClass } from '../../components/ui/Field';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../data/seed';
import { firstName } from '../../lib/names';
import { paths } from '../../lib/routes';
import { validateLogin } from '../../lib/validation';
import { AuthLayout } from './AuthLayout';

const DEMO_BUTTONS = [
  { label: 'Professor', ...DEMO_ACCOUNTS.professor },
  { label: 'Student', ...DEMO_ACCOUNTS.student },
];

export function LoginPage() {
  const { login, sessionNotice, clearSessionNotice } = useAuth();
  const { resetDemoData } = useData();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const errors = validateLogin({ email, password });
  const emailError = attempted || touched.email ? errors.email : undefined;
  const passwordError = attempted || touched.password ? errors.password : undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setFormError(null);
    clearSessionNotice();

    if (errors.email) return document.getElementById('login-email')?.focus();
    if (errors.password) return document.getElementById('login-password')?.focus();

    setSubmitting(true);
    const result = await login(email, password);
    if (!result.ok) {
      setFormError(result.error);
      setSubmitting(false);
      document.getElementById('login-password')?.focus();
      return;
    }
    // On success the route guard redirects to the user's own dashboard.
    toast(`Welcome back, ${firstName(result.user.name)}!`);
  }

  function fillDemo(account: { email: string }) {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setFormError(null);
    setTouched({ email: false, password: false });
    setAttempted(false);
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Sign in to see your courses and assignments."
      footer={
        <>
          New here?{' '}
          <Link to={paths.register} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
            Create an account
          </Link>
        </>
      }
    >
      {sessionNotice && (
        <p
          role="status"
          className="mb-4 flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2.5 text-sm text-sky-900 dark:bg-sky-500/10 dark:text-sky-200"
        >
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {sessionNotice}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800 dark:bg-red-500/10 dark:text-red-300"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {formError}
          </p>
        )}

        <Field id="login-email" label="Email" required error={emailError}>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            aria-required="true"
            className={inputClass(!!emailError)}
            {...describedBy('login-email', emailError)}
          />
        </Field>

        <Field id="login-password" label="Password" required error={passwordError}>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            aria-required="true"
            invalid={!!passwordError}
            {...describedBy('login-password', passwordError)}
          />
        </Field>

        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <section
        aria-labelledby="demo-heading"
        className="mt-6 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700"
      >
        <h2 id="demo-heading" className="text-sm font-semibold">
          Demo accounts
        </h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Password for all demo accounts: <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">{DEMO_PASSWORD}</code>
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DEMO_BUTTONS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemo(account)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-500/60 dark:hover:bg-indigo-500/10"
            >
              <span className="block text-sm font-medium">Use {account.label.toLowerCase()} account</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{account.email}</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setConfirmReset(true)}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Reset demo data
        </Button>
      </section>

      <ConfirmDialog
        open={confirmReset}
        tone="danger"
        title="Reset demo data?"
        description="This restores the original sample users, courses and assignments, and removes any accounts or work you created."
        confirmLabel="Reset data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          toast('Demo data has been reset.', 'info');
        }}
      />
    </AuthLayout>
  );
}
