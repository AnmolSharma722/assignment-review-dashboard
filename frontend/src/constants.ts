import type { ProfessorFilter, SortKey, StudentFilter } from './types';

interface Option<T extends string> {
  value: T;
  label: string;
}

export const SORT_OPTIONS: Option<SortKey>[] = [
  { value: 'deadline-asc', label: 'Deadline (soonest)' },
  { value: 'deadline-desc', label: 'Deadline (latest)' },
  { value: 'title', label: 'Title (A–Z)' },
];

export const STUDENT_FILTERS: Option<StudentFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'not-submitted', label: 'Not submitted' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'overdue', label: 'Overdue' },
];

export const PROFESSOR_FILTERS: Option<ProfessorFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past-deadline', label: 'Past deadline' },
  { value: 'complete', label: 'Fully submitted' },
];
