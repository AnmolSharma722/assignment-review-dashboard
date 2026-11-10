import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import type { Course, CourseAccent } from '../../types';

const ACCENTS: Record<CourseAccent, { bar: string; chip: string }> = {
  indigo: {
    bar: 'bg-indigo-500',
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  },
  emerald: {
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  rose: {
    bar: 'bg-rose-500',
    chip: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
  amber: {
    bar: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  sky: {
    bar: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  violet: {
    bar: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
};

interface CourseCardProps {
  course: Course;
  /** Where the card navigates to. */
  to: string;
  /** Small line above the stats, e.g. the professor's name. */
  subtitle?: string;
  /** Position in the grid, used to stagger the entrance animation. */
  index: number;
  /** Stats area (progress, counts...). */
  children: ReactNode;
}

/**
 * A whole-card link using the "stretched link" pattern: only the course name is a real
 * link (so screen readers announce a short, clear name) but its ::after covers the card,
 * making the entire card clickable.
 */
export function CourseCard({ course, to, subtitle, index, children }: CourseCardProps) {
  const accent = ACCENTS[course.accent];
  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className="group relative flex h-full animate-slide-up flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 focus-within:ring-2 focus-within:ring-indigo-500 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={cn('h-1.5', accent.bar)} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('rounded-md px-2 py-0.5 text-xs font-bold tracking-wide', accent.chip)}>
            {course.code}
          </span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300"
          />
        </div>
        <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-50">
          <Link
            to={to}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {course.name}
          </Link>
        </h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{course.description}</p>
        <div className="mt-auto pt-5">{children}</div>
      </div>
    </article>
  );
}
