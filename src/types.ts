export type Role = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  /** Calendar date in local time, formatted `YYYY-MM-DD`. */
  dueDate: string;
  /** External Google Drive (or similar) link where students upload their work. */
  driveLink: string;
  /** Id of the admin (professor) who created it. */
  createdBy: string;
  /** Either every student, or an explicit list of student ids. */
  assignedTo: 'all' | string[];
  createdAt: string;
}

/** A student's confirmation that they have submitted an assignment. */
export interface Submission {
  assignmentId: string;
  studentId: string;
  /** ISO timestamp. */
  submittedAt: string;
}

/** The whole "backend": persisted as one JSON document in localStorage. */
export interface Database {
  version: 1;
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
}

/** Fields an admin edits in the create / edit form. */
export interface AssignmentInput {
  title: string;
  description: string;
  dueDate: string;
  driveLink: string;
  assignedTo: 'all' | string[];
}

/** Derived (never stored) status of an assignment for one student. */
export type StudentStatus = 'submitted' | 'pending' | 'overdue';

export interface Progress {
  done: number;
  total: number;
  /** Whole number, 0-100. */
  percent: number;
}

export type SortKey = 'due-asc' | 'due-desc' | 'title';
export type StudentFilter = 'all' | 'not-submitted' | 'submitted' | 'overdue';
export type AdminFilter = 'all' | 'upcoming' | 'past-due' | 'complete';
