import { useState, type FormEvent } from 'react';
import { BookOpenCheck, CircleAlert, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Field, describedBy, inputClass } from '../../components/ui/Field';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/cn';
import { firstName } from '../../lib/names';
import { paths } from '../../lib/routes';
import { validateRegister, type RegisterValues } from '../../lib/validation';
import type { Role } from '../../types';
import { AuthLayout } from './AuthLayout';

const ROLES: { value: Role; label: string; description: string; Icon: typeof GraduationCap }[] = [
  {
    value: 'student',
    label: 'Student',
    description: 'Enroll in courses, join groups and submit work.',
    Icon: GraduationCap,
  },
  {
    value: 'professor',
    label: 'Professor',
    description: 'Create courses and assignments and track submissions.',
    Icon: BookOpenCheck,
  },
];

type FieldKey = keyof RegisterValues;
const FIELD_ORDER: { key: FieldKey; id: string }[] = [
  { key: 'name', id: 'reg-name' },
  { key: 'email', id: 'reg-email' },
  { key: 'role', id: 'reg-role-student' },
  { key: 'password', id: 'reg-password' },
  { key: 'confirmPassword', id: 'reg-confirm' },
];

export function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();

  const [values, setValues] = useState<RegisterValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errors = validateRegister(values);
  const shown = (key: FieldKey) => (attempted || touched[key] ? errors[key] : undefined);
  const touch = (key: FieldKey) => () => setTouched((t) => ({ ...t, [key]: true }));
  const set = <K extends FieldKey>(key: K, value: RegisterValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setFormError(null);

    const firstInvalid = FIELD_ORDER.find(({ key }) => errors[key]);
    if (firstInvalid) {
      document.getElementById(firstInvalid.id)?.focus();
      return;
    }

    setSubmitting(true);
    const result = await register({
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role as Role,
    });
    if (!result.ok) {
      setFormError(result.error);
      setSubmitting(false);
      document.getElementById('reg-email')?.focus();
      return;
    }
    // On success the route guard sends the new user to their own dashboard.
    toast(`Account created. Welcome, ${firstName(result.user.name)}!`);
  }

  const nameError = shown('name');
  const emailError = shown('email');
  const roleError = shown('role');
  const passwordError = shown('password');
  const confirmError = shown('confirmPassword');

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Choose your role to get a dashboard built for the way you work."
      footer={
        <>
          Already have an account?{' '}
          <Link to={paths.login} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
            Sign in
          </Link>
        </>
      }
    >
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

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
            I am a<span aria-hidden="true" className="ml-0.5 text-red-600 dark:text-red-400">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLES.map(({ value, label, description, Icon }) => {
              const selected = values.role === value;
              return (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-500',
                    selected
                      ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                  )}
                >
                  <input
                    id={`reg-role-${value}`}
                    type="radio"
                    name="role"
                    value={value}
                    checked={selected}
                    onChange={() => set('role', value)}
                    onBlur={touch('role')}
                    className="sr-only"
                    {...describedBy('reg-role-error', roleError, 'x')}
                  />
                  <Icon
                    aria-hidden="true"
                    className={cn('mt-0.5 size-5 shrink-0', selected ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400')}
                  />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-slate-600 dark:text-slate-400">{description}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {roleError && (
            <p id="reg-role-error" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              {roleError}
            </p>
          )}
        </fieldset>

        <Field id="reg-name" label="Full name" required error={nameError}>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={touch('name')}
            aria-required="true"
            className={inputClass(!!nameError)}
            {...describedBy('reg-name', nameError)}
          />
        </Field>

        <Field id="reg-email" label="Email" required error={emailError}>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={touch('email')}
            aria-required="true"
            className={inputClass(!!emailError)}
            {...describedBy('reg-email', emailError)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="reg-password"
            label="Password"
            required
            hint="At least 8 characters, with a letter and a number."
            error={passwordError}
          >
            <PasswordInput
              id="reg-password"
              autoComplete="new-password"
              value={values.password}
              onChange={(e) => set('password', e.target.value)}
              onBlur={touch('password')}
              aria-required="true"
              invalid={!!passwordError}
              {...describedBy('reg-password', passwordError, 'hint')}
            />
          </Field>

          <Field id="reg-confirm" label="Confirm password" required error={confirmError}>
            <PasswordInput
              id="reg-confirm"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              onBlur={touch('confirmPassword')}
              aria-required="true"
              invalid={!!confirmError}
              {...describedBy('reg-confirm', confirmError)}
            />
          </Field>
        </div>

        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
