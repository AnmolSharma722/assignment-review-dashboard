export type Role = 'student' | 'professor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Mock salted hash (see lib/token.ts). This is a demo, not real security. */
  passwordHash: string;
  createdAt: string;
}

export type CourseAccent = 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky' | 'violet';

export interface Course {
  id: string;
  /** Short code such as "CS201". */
  code: string;
  name: string;
  description: string;
  professorId: string;
  accent: CourseAccent;
  /** Students enrolled this semester. */
  enrolledStudentIds: string[];
  createdAt: string;
}

export type SubmissionType = 'individual' | 'group';

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  /** Deadline as a full ISO-8601 instant (date AND time). */
  deadline: string;
  /** External OneDrive link where students upload their work. */
  oneDriveLink: string;
  submissionType: SubmissionType;
  createdBy: string;
  createdAt: string;
}

export interface Group {
  id: string;
  courseId: string;
  name: string;
  /** The student who created the group; only they can acknowledge group assignments. */
  leaderId: string;
  /** Includes the leader. */
  memberIds: string[];
  createdAt: string;
}

/**
 * "Yes, I have submitted" record.
 *  - individual assignments: subjectType 'student', subjectId = the student's id
 *  - group assignments:      subjectType 'group',   subjectId = the group's id
 * `acknowledgedBy` is the user who pressed the button (the leader, for groups).
 */
export interface Acknowledgement {
  assignmentId: string;
  subjectType: 'student' | 'group';
  subjectId: string;
  acknowledgedBy: string;
  /** ISO timestamp. */
  acknowledgedAt: string;
}

/** The whole "backend": persisted as one JSON document in localStorage. */
export interface Database {
  version: 2;
  users: User[];
  courses: Course[];
  assignments: Assignment[];
  groups: Group[];
  acknowledgements: Acknowledgement[];
}

/** Fields a professor edits in the create / edit assignment form. */
export interface AssignmentInput {
  title: string;
  description: string;
  /** ISO instant. */
  deadline: string;
  oneDriveLink: string;
  submissionType: SubmissionType;
}

export interface CourseInput {
  code: string;
  name: string;
  description: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

/** Derived (never stored) status of an assignment for one student or group. */
export type SubmissionStatus = 'submitted' | 'pending' | 'overdue';

export interface Progress {
  done: number;
  total: number;
  /** Whole number, 0-100. */
  percent: number;
}

export type SortKey = 'deadline-asc' | 'deadline-desc' | 'title';
export type StudentFilter = 'all' | 'not-submitted' | 'submitted' | 'overdue';
export type ProfessorFilter = 'all' | 'upcoming' | 'past-deadline' | 'complete';
