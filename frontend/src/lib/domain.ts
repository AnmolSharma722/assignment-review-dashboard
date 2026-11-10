/**
 * Pure, read-only domain logic: no React, no localStorage. Everything the UI needs
 * to derive from the raw data (what a user may see, submission status, progress,
 * tracking tables, filtering and sorting) lives here so it is trivially testable.
 */
import type {
  Acknowledgement,
  Assignment,
  Course,
  Database,
  Group,
  Progress,
  ProfessorFilter,
  SortKey,
  StudentFilter,
  SubmissionStatus,
  User,
} from '../types';
import { isPastDeadline } from './dates';

// ---------------------------------------------------------------- lookups

export const findUser = (db: Database, id: string): User | undefined =>
  db.users.find((u) => u.id === id);

export const findCourse = (db: Database, id: string): Course | undefined =>
  db.courses.find((c) => c.id === id);

export const getStudents = (users: User[]): User[] => users.filter((u) => u.role === 'student');

/** Courses a professor teaches. */
export const getCoursesForProfessor = (db: Database, professorId: string): Course[] =>
  db.courses.filter((c) => c.professorId === professorId);

/** Courses a student is enrolled in. */
export const getCoursesForStudent = (db: Database, studentId: string): Course[] =>
  db.courses.filter((c) => c.enrolledStudentIds.includes(studentId));

/** Courses a student could still enroll in. */
export const getJoinableCourses = (db: Database, studentId: string): Course[] =>
  db.courses.filter((c) => !c.enrolledStudentIds.includes(studentId));

export const getEnrolledStudents = (db: Database, course: Course): User[] =>
  course.enrolledStudentIds
    .map((id) => findUser(db, id))
    .filter((u): u is User => u !== undefined && u.role === 'student');

export const getAssignmentsForCourse = (db: Database, courseId: string): Assignment[] =>
  db.assignments.filter((a) => a.courseId === courseId);

export const getGroupsForCourse = (db: Database, courseId: string): Group[] =>
  db.groups.filter((g) => g.courseId === courseId);

export const getGroupForStudent = (db: Database, courseId: string, studentId: string): Group | undefined =>
  db.groups.find((g) => g.courseId === courseId && g.memberIds.includes(studentId));

/** Members of a group, leader first. */
export function getGroupMembers(db: Database, group: Group): User[] {
  const members = group.memberIds
    .map((id) => findUser(db, id))
    .filter((u): u is User => u !== undefined);
  return [...members].sort((a, b) => Number(b.id === group.leaderId) - Number(a.id === group.leaderId));
}

export function findAcknowledgement(
  db: Database,
  assignmentId: string,
  subjectType: Acknowledgement['subjectType'],
  subjectId: string,
): Acknowledgement | undefined {
  return db.acknowledgements.find(
    (a) => a.assignmentId === assignmentId && a.subjectType === subjectType && a.subjectId === subjectId,
  );
}

export function calcProgress(done: number, total: number): Progress {
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function deriveStatus(
  submitted: boolean,
  deadline: string,
  now: Date = new Date(),
): SubmissionStatus {
  if (submitted) return 'submitted';
  return isPastDeadline(deadline, now) ? 'overdue' : 'pending';
}

export const wasLate = (acknowledgement: Acknowledgement, assignment: Assignment): boolean =>
  new Date(acknowledgement.acknowledgedAt).getTime() > new Date(assignment.deadline).getTime();

// ---------------------------------------------------------------- student view

export type StudentAssignmentState =
  | {
      kind: 'individual';
      status: SubmissionStatus;
      acknowledgement?: Acknowledgement;
    }
  | {
      kind: 'group';
      status: SubmissionStatus;
      group: Group;
      leader?: User;
      isLeader: boolean;
      acknowledgement?: Acknowledgement;
      /** Who pressed the button (the leader). */
      acknowledgedBy?: User;
    }
  | {
      kind: 'no-group';
      status: Exclude<SubmissionStatus, 'submitted'>;
    };

/** What one student sees for one assignment (individual, group or "no group yet"). */
export function getStudentAssignmentState(
  db: Database,
  assignment: Assignment,
  studentId: string,
  now: Date = new Date(),
): StudentAssignmentState {
  if (assignment.submissionType === 'individual') {
    const acknowledgement = findAcknowledgement(db, assignment.id, 'student', studentId);
    return {
      kind: 'individual',
      status: deriveStatus(!!acknowledgement, assignment.deadline, now),
      acknowledgement,
    };
  }

  const group = getGroupForStudent(db, assignment.courseId, studentId);
  if (!group) {
    return {
      kind: 'no-group',
      status: isPastDeadline(assignment.deadline, now) ? 'overdue' : 'pending',
    };
  }
  const acknowledgement = findAcknowledgement(db, assignment.id, 'group', group.id);
  return {
    kind: 'group',
    status: deriveStatus(!!acknowledgement, assignment.deadline, now),
    group,
    leader: findUser(db, group.leaderId),
    isLeader: group.leaderId === studentId,
    acknowledgement,
    acknowledgedBy: acknowledgement ? findUser(db, acknowledgement.acknowledgedBy) : undefined,
  };
}

export interface CourseSummary {
  progress: Progress;
  overdue: number;
  assignmentCount: number;
}

/** A student's progress through one course: submitted / total assignments. */
export function getStudentCourseSummary(
  db: Database,
  courseId: string,
  studentId: string,
  now: Date = new Date(),
): CourseSummary {
  const assignments = getAssignmentsForCourse(db, courseId);
  const statuses = assignments.map((a) => getStudentAssignmentState(db, a, studentId, now).status);
  return {
    progress: calcProgress(statuses.filter((s) => s === 'submitted').length, assignments.length),
    overdue: statuses.filter((s) => s === 'overdue').length,
    assignmentCount: assignments.length,
  };
}

// ---------------------------------------------------------------- professor view

export interface TrackingRow {
  id: string;
  kind: 'student' | 'group';
  /** Student name or group name. */
  name: string;
  status: SubmissionStatus;
  acknowledgedAt?: string;
  /** For groups: the leader who acknowledged. For students: the student themself. */
  acknowledgedBy?: User;
  /** Group rows only. */
  leader?: User;
  members?: User[];
}

export interface AssignmentTracking {
  /** What is being counted: individual students, or groups. */
  unit: 'student' | 'group';
  rows: TrackingRow[];
  progress: Progress;
  /** Group assignments only: enrolled students who are not in any group yet. */
  ungroupedStudents: User[];
}

/** Who has submitted and who has not, for one assignment. */
export function getAssignmentTracking(
  db: Database,
  assignment: Assignment,
  now: Date = new Date(),
): AssignmentTracking {
  const course = findCourse(db, assignment.courseId);
  const students = course ? getEnrolledStudents(db, course) : [];

  if (assignment.submissionType === 'individual') {
    const rows: TrackingRow[] = students.map((student) => {
      const ack = findAcknowledgement(db, assignment.id, 'student', student.id);
      return {
        id: student.id,
        kind: 'student',
        name: student.name,
        status: deriveStatus(!!ack, assignment.deadline, now),
        acknowledgedAt: ack?.acknowledgedAt,
        acknowledgedBy: ack ? student : undefined,
      };
    });
    return {
      unit: 'student',
      rows,
      progress: calcProgress(rows.filter((r) => r.status === 'submitted').length, rows.length),
      ungroupedStudents: [],
    };
  }

  const groups = getGroupsForCourse(db, assignment.courseId);
  const rows: TrackingRow[] = groups.map((group) => {
    const ack = findAcknowledgement(db, assignment.id, 'group', group.id);
    return {
      id: group.id,
      kind: 'group',
      name: group.name,
      status: deriveStatus(!!ack, assignment.deadline, now),
      acknowledgedAt: ack?.acknowledgedAt,
      acknowledgedBy: ack ? findUser(db, ack.acknowledgedBy) : undefined,
      leader: findUser(db, group.leaderId),
      members: getGroupMembers(db, group),
    };
  });
  const grouped = new Set(groups.flatMap((g) => g.memberIds));
  return {
    unit: 'group',
    rows,
    progress: calcProgress(rows.filter((r) => r.status === 'submitted').length, rows.length),
    ungroupedStudents: students.filter((s) => !grouped.has(s.id)),
  };
}

/** Aggregate completion across assignments (sum submitted / sum total). */
export function getCourseCompletion(
  db: Database,
  courseId: string,
  now: Date = new Date(),
): Progress {
  const trackings = getAssignmentsForCourse(db, courseId).map((a) => getAssignmentTracking(db, a, now).progress);
  return calcProgress(
    trackings.reduce((sum, p) => sum + p.done, 0),
    trackings.reduce((sum, p) => sum + p.total, 0),
  );
}

/** Assignments whose deadline has passed and which not everyone has submitted. */
export function countNeedingAttention(db: Database, courseId: string, now: Date = new Date()): number {
  return getAssignmentsForCourse(db, courseId).filter((a) => {
    const { progress } = getAssignmentTracking(db, a, now);
    return isPastDeadline(a.deadline, now) && progress.done < progress.total;
  }).length;
}

// ---------------------------------------------------------------- search / filter / sort

export function matchesSearch(assignment: Assignment, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return assignment.title.toLowerCase().includes(q) || assignment.description.toLowerCase().includes(q);
}

export function matchesStudentFilter(status: SubmissionStatus, filter: StudentFilter): boolean {
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

export function matchesProfessorFilter(
  assignment: Assignment,
  progress: Progress,
  filter: ProfessorFilter,
  now: Date = new Date(),
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'upcoming':
      return !isPastDeadline(assignment.deadline, now);
    case 'past-deadline':
      return isPastDeadline(assignment.deadline, now);
    case 'complete':
      return progress.total > 0 && progress.done === progress.total;
  }
}

/** Returns a new, sorted array. */
export function sortAssignments<T>(
  items: T[],
  key: SortKey,
  getAssignment: (item: T) => Assignment,
): T[] {
  const byTitle = (a: T, b: T) =>
    getAssignment(a).title.localeCompare(getAssignment(b).title, undefined, { sensitivity: 'base' });
  const time = (item: T) => new Date(getAssignment(item).deadline).getTime();
  const byDeadline = (a: T, b: T) => time(a) - time(b) || byTitle(a, b);

  const sorted = [...items];
  switch (key) {
    case 'deadline-asc':
      return sorted.sort(byDeadline);
    case 'deadline-desc':
      return sorted.sort((a, b) => byDeadline(b, a));
    case 'title':
      return sorted.sort(byTitle);
  }
}
