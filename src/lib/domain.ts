/**
 * Pure domain logic: no React, no localStorage. Everything the UI needs to
 * derive from the raw data (who is assigned what, statuses, progress,
 * filtering, sorting) lives here so it is trivially unit-testable.
 */
import type {
  AdminFilter,
  Assignment,
  Database,
  Progress,
  SortKey,
  StudentFilter,
  StudentStatus,
  Submission,
  User,
} from '../types';
import { isPastDue } from './dates';

export const getStudents = (users: User[]): User[] => users.filter((u) => u.role === 'student');

export function isAssignedTo(assignment: Assignment, studentId: string): boolean {
  return assignment.assignedTo === 'all' || assignment.assignedTo.includes(studentId);
}

export function getAssignedStudents(assignment: Assignment, students: User[]): User[] {
  return students.filter((s) => isAssignedTo(assignment, s.id));
}

export function findSubmission(
  submissions: Submission[],
  assignmentId: string,
  studentId: string,
): Submission | undefined {
  return submissions.find((s) => s.assignmentId === assignmentId && s.studentId === studentId);
}

/** Status is derived from the submission + due date, never stored. */
export function getStudentStatus(
  assignment: Assignment,
  studentId: string,
  submissions: Submission[],
  now: Date = new Date(),
): StudentStatus {
  if (findSubmission(submissions, assignment.id, studentId)) return 'submitted';
  return isPastDue(assignment.dueDate, now) ? 'overdue' : 'pending';
}

export const getAssignmentsForStudent = (db: Database, studentId: string): Assignment[] =>
  db.assignments.filter((a) => isAssignedTo(a, studentId));

export const getAssignmentsForAdmin = (db: Database, adminId: string): Assignment[] =>
  db.assignments.filter((a) => a.createdBy === adminId);

export function calcProgress(done: number, total: number): Progress {
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Class completion for one assignment: submitted / assigned students. */
export function getAssignmentProgress(assignment: Assignment, db: Database): Progress {
  const assigned = getAssignedStudents(assignment, getStudents(db.users));
  const done = assigned.filter((s) => findSubmission(db.submissions, assignment.id, s.id)).length;
  return calcProgress(done, assigned.length);
}

/** Aggregate completion across several assignments (sum of submitted / sum of assigned). */
export function getOverallProgress(assignments: Assignment[], db: Database): Progress {
  const parts = assignments.map((a) => getAssignmentProgress(a, db));
  return calcProgress(
    parts.reduce((sum, p) => sum + p.done, 0),
    parts.reduce((sum, p) => sum + p.total, 0),
  );
}

// ---------------------------------------------------------------- search / filter / sort

export function matchesSearch(assignment: Assignment, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    assignment.title.toLowerCase().includes(q) || assignment.description.toLowerCase().includes(q)
  );
}

export function matchesStudentFilter(status: StudentStatus, filter: StudentFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'submitted':
      return status === 'submitted';
    case 'overdue':
      return status === 'overdue';
    case 'not-submitted':
      return status !== 'submitted';
  }
}

export function matchesAdminFilter(
  assignment: Assignment,
  progress: Progress,
  filter: AdminFilter,
  now: Date = new Date(),
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'upcoming':
      return !isPastDue(assignment.dueDate, now);
    case 'past-due':
      return isPastDue(assignment.dueDate, now);
    case 'complete':
      return progress.total > 0 && progress.done === progress.total;
  }
}

/** Returns a new, sorted array. ISO dates sort correctly as plain strings. */
export function sortAssignments<T>(
  items: T[],
  key: SortKey,
  getAssignment: (item: T) => Assignment,
): T[] {
  const byTitle = (a: T, b: T) =>
    getAssignment(a).title.localeCompare(getAssignment(b).title, undefined, {
      sensitivity: 'base',
    });
  const byDue = (a: T, b: T) =>
    getAssignment(a).dueDate.localeCompare(getAssignment(b).dueDate) || byTitle(a, b);

  const sorted = [...items];
  switch (key) {
    case 'due-asc':
      return sorted.sort(byDue);
    case 'due-desc':
      return sorted.sort((a, b) => byDue(b, a));
    case 'title':
      return sorted.sort(byTitle);
  }
}
