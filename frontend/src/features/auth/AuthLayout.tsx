import type { ReactNode } from 'react';
import { ClipboardList, GraduationCap, Users, CircleCheck } from 'lucide-react';
import { ThemeToggle } from '../../components/layout/ThemeToggle';

const HIGHLIGHTS = [
  { Icon: GraduationCap, text: 'Courses, assignments and deadlines in one place' },
  { Icon: Users, text: 'Group work with a leader who confirms the submission' },
  { Icon: CircleCheck, text: 'Live progress for every student and group' },
];

/** Split-screen shell shared by the login and register pages. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[5fr_6fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 size-80 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-16 size-96 rounded-full bg-violet-400/20 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <ClipboardList aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Assignment &amp; Review Dashboard</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-bold tracking-tight">
            Every assignment, every deadline, every group. Clear at a glance.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-indigo-50">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-200">Front-end demo · data is stored in your browser</p>
      </aside>

      <div className="flex min-h-dvh flex-col lg:min-h-0">
        <div className="flex items-center justify-between p-3 sm:p-4 lg:justify-end">
          <span className="flex items-center gap-2 pl-1 text-sm font-semibold lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ClipboardList aria-hidden="true" className="size-4" />
            </span>
            Assignment Dashboard
          </span>
          <ThemeToggle />
        </div>

        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-10 sm:px-6">
          <div className="animate-slide-up">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
            <div className="mt-6">{children}</div>
            <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
