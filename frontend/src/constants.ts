import type { AdminFilter, SortKey, StudentFilter } from './types';

interface Option<T extends string> {
  value: T;
  label: string;
}

export const SORT_OPTIONS: Option<SortKey>[] = [
  { value: 'due-asc', label: 'Due date (soonest)' },
  { value: 'due-desc', label: 'Due date (latest)' },
  { value: 'title', label: 'Title (A–Z)' },
];

export const STUDENT_FILTERS: Option<StudentFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'not-submitted', label: 'Not submitted' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'overdue', label: 'Overdue' },
];

export const ADMIN_FILTERS: Option<AdminFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past-due', label: 'Past due' },
  { value: 'complete', label: 'Fully submitted' },
];
