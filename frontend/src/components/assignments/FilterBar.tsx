import { useId } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { inputClass } from '../ui/Field';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface FilterBarProps<F extends string, S extends string> {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel?: string;
  filterLabel: string;
  filters: Option<F>[];
  filter: F;
  onFilterChange: (value: F) => void;
  sortOptions: Option<S>[];
  sort: S;
  onSortChange: (value: S) => void;
}

/** Search box + filter chips + sort dropdown, shared by the student and admin views. */
export function FilterBar<F extends string, S extends string>({
  search,
  onSearchChange,
  searchLabel = 'Search assignments',
  filterLabel,
  filters,
  filter,
  onFilterChange,
  sortOptions,
  sort,
  onSortChange,
}: FilterBarProps<F, S>) {
  const searchId = useId();
  const sortId = useId();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:bg-slate-900">
      <div className="relative lg:w-72">
        <label htmlFor={searchId} className="sr-only">
          {searchLabel}
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
        />
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or description"
          className={cn(inputClass(false), 'pl-9')}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        <div role="group" aria-label={filterLabel} className="flex flex-wrap gap-1.5">
          {filters.map((option) => {
            const active = option.value === filter;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onFilterChange(option.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor={sortId} className="text-sm text-slate-600 dark:text-slate-400">
            Sort by
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(e) => onSortChange(e.target.value as S)}
            className={cn(inputClass(false), 'w-auto py-1.5')}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
