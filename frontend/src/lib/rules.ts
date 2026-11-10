/**
 * Business rules for every action that changes data.
 *
 * Each function is PURE: it takes the current database and returns either a new
 * database or an error message. The UI never decides who is allowed to do what;
 * it only offers the buttons, and these rules are the real gatekeeper (just like
 * server-side validation would be with a real backend).
 */
import { hashPassword } from './token';
import { createId } from './ids';
import { findAcknowledgement, findCourse, getGroupForStudent } from './domain';
import { validateGroupName } from './validation';
import type {
  Acknowledgement,
  Assignment,
  AssignmentInput,
  Course,
  CourseAccent,
  CourseInput,
  Database,
  Group,
  RegisterInput,
  User,
} from '../types';

export type Result<T extends object = object> =
  | ({ ok: true; db: Database } & T)
  | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

const ACCENTS: CourseAccent[] = ['indigo', 'emerald', 'rose', 'amber', 'sky', 'violet'];

const normaliseEmail = (email: string) => email.trim().toLowerCase();

// ---------------------------------------------------------------- accounts

export function registerUser(
  db: Database,
  input: RegisterInput,
  now: Date = new Date(),
): Result<{ user: User }> {
  const email = normaliseEmail(input.email);
  if (db.users.some((u) => normaliseEmail(u.email) === email)) {
    return fail('An account with this email already exists. Try signing in instead.');
  }
  const user: User = {
    id: createId(input.role === 'student' ? 'stu' : 'prof'),
    name: input.name.trim(),
    email,
    role: input.role,
    passwordHash: hashPassword(email, input.password),
    createdAt: now.toISOString(),
  };
  return { ok: true, db: { ...db, users: [...db.users, user] }, user };
}

/** Returns the matching user, or null when the email/password pair is wrong. */
export function authenticate(db: Database, email: string, password: string): User | null {
  const normalised = normaliseEmail(email);
  const user = db.users.find((u) => normaliseEmail(u.email) === normalised);
  return user && user.passwordHash === hashPassword(normalised, password) ? user : null;
}

// ---------------------------------------------------------------- courses

export function createCourse(
  db: Database,
  professorId: string,
  input: CourseInput,
  now: Date = new Date(),
): Result<{ course: Course }> {
  const professor = db.users.find((u) => u.id === professorId);
  if (!professor || professor.role !== 'professor') return fail('Only professors can create courses.');

  const code = input.code.trim().toUpperCase();
  if (db.courses.some((c) => c.code.toUpperCase() === code)) {
    return fail(`A course with the code ${code} already exists.`);
  }
  const course: Course = {
    id: createId('crs'),
    code,
    name: input.name.trim(),
    description: input.description.trim(),
    professorId,
    accent: ACCENTS[db.courses.length % ACCENTS.length],
    enrolledStudentIds: [],
    createdAt: now.toISOString(),
  };
  return { ok: true, db: { ...db, courses: [...db.courses, course] }, course };
}

export function enrollStudent(db: Database, courseId: string, studentId: string): Result {
  const student = db.users.find((u) => u.id === studentId);
  const course = findCourse(db, courseId);
  if (!student || student.role !== 'student') return fail('Only students can enroll in courses.');
  if (!course) return fail('That course no longer exists.');
  if (course.enrolledStudentIds.includes(studentId)) return fail('You are already enrolled in this course.');
  return {
    ok: true,
    db: {
      ...db,
      courses: db.courses.map((c) =>
        c.id === courseId ? { ...c, enrolledStudentIds: [...c.enrolledStudentIds, studentId] } : c,
      ),
    },
  };
}

// ---------------------------------------------------------------- assignments

export function createAssignment(
  db: Database,
  professorId: string,
  courseId: string,
  input: AssignmentInput,
  now: Date = new Date(),
): Result<{ assignment: Assignment }> {
  const course = findCourse(db, courseId);
  if (!course || course.professorId !== professorId) {
    return fail('You can only add assignments to courses you teach.');
  }
  const assignment: Assignment = {
    ...input,
    id: createId('asg'),
    courseId,
    createdBy: professorId,
    createdAt: now.toISOString(),
  };
  return { ok: true, db: { ...db, assignments: [...db.assignments, assignment] }, assignment };
}

export function updateAssignment(
  db: Database,
  professorId: string,
  assignmentId: string,
  input: AssignmentInput,
): Result {
  const existing = db.assignments.find((a) => a.id === assignmentId);
  const course = existing && findCourse(db, existing.courseId);
  if (!existing || !course || course.professorId !== professorId) {
    return fail('You can only edit assignments in courses you teach.');
  }
  const hasAcknowledgements = db.acknowledgements.some((a) => a.assignmentId === assignmentId);
  if (hasAcknowledgements && input.submissionType !== existing.submissionType) {
    return fail("The submission type can't be changed once students have acknowledged this assignment.");
  }
  return {
    ok: true,
    db: {
      ...db,
      assignments: db.assignments.map((a) => (a.id === assignmentId ? { ...a, ...input } : a)),
    },
  };
}

export function deleteAssignment(db: Database, professorId: string, assignmentId: string): Result {
  const existing = db.assignments.find((a) => a.id === assignmentId);
  const course = existing && findCourse(db, existing.courseId);
  if (!existing || !course || course.professorId !== professorId) {
    return fail('You can only delete assignments in courses you teach.');
  }
  return {
    ok: true,
    db: {
      ...db,
      assignments: db.assignments.filter((a) => a.id !== assignmentId),
      acknowledgements: db.acknowledgements.filter((a) => a.assignmentId !== assignmentId),
    },
  };
}

// ---------------------------------------------------------------- groups

export function createGroup(
  db: Database,
  studentId: string,
  courseId: string,
  name: string,
  now: Date = new Date(),
): Result<{ group: Group }> {
  const course = findCourse(db, courseId);
  if (!course || !course.enrolledStudentIds.includes(studentId)) {
    return fail('You must be enrolled in this course to create a group.');
  }
  if (getGroupForStudent(db, courseId, studentId)) {
    return fail('You are already in a group for this course.');
  }
  const nameError = validateGroupName(name);
  if (nameError) return fail(nameError);

  const trimmed = name.trim();
  if (db.groups.some((g) => g.courseId === courseId && g.name.toLowerCase() === trimmed.toLowerCase())) {
    return fail(`A group named “${trimmed}” already exists in this course.`);
  }
  const group: Group = {
    id: createId('grp'),
    courseId,
    name: trimmed,
    leaderId: studentId, // the creator becomes the leader
    memberIds: [studentId],
    createdAt: now.toISOString(),
  };
  return { ok: true, db: { ...db, groups: [...db.groups, group] }, group };
}

export function joinGroup(db: Database, studentId: string, groupId: string): Result<{ group: Group }> {
  const group = db.groups.find((g) => g.id === groupId);
  if (!group) return fail('That group no longer exists.');
  const course = findCourse(db, group.courseId);
  if (!course || !course.enrolledStudentIds.includes(studentId)) {
    return fail('You must be enrolled in this course to join a group.');
  }
  if (getGroupForStudent(db, group.courseId, studentId)) {
    return fail('You are already in a group for this course.');
  }
  const joined: Group = { ...group, memberIds: [...group.memberIds, studentId] };
  return {
    ok: true,
    db: { ...db, groups: db.groups.map((g) => (g.id === groupId ? joined : g)) },
    group: joined,
  };
}

// ---------------------------------------------------------------- acknowledgement

/**
 * "Yes, I have submitted" -> confirm.
 *  - individual assignment: the student acknowledges for themself
 *  - group assignment: ONLY the group leader can acknowledge, and it counts for the
 *    whole group (every member then sees who acknowledged it and when)
 */
export function acknowledgeAssignment(
  db: Database,
  actorId: string,
  assignmentId: string,
  now: Date = new Date(),
): Result<{ acknowledgement: Acknowledgement }> {
  const assignment = db.assignments.find((a) => a.id === assignmentId);
  if (!assignment) return fail('That assignment no longer exists.');
  const course = findCourse(db, assignment.courseId);
  const actor = db.users.find((u) => u.id === actorId);
  if (!actor || actor.role !== 'student' || !course || !course.enrolledStudentIds.includes(actorId)) {
    return fail('Only students enrolled in this course can acknowledge an assignment.');
  }

  let acknowledgement: Acknowledgement;
  if (assignment.submissionType === 'individual') {
    if (findAcknowledgement(db, assignmentId, 'student', actorId)) {
      return fail('You have already acknowledged this assignment.');
    }
    acknowledgement = {
      assignmentId,
      subjectType: 'student',
      subjectId: actorId,
      acknowledgedBy: actorId,
      acknowledgedAt: now.toISOString(),
    };
  } else {
    const group = getGroupForStudent(db, assignment.courseId, actorId);
    if (!group) {
      return fail('You are not part of any group. Create or join one to submit this assignment.');
    }
    if (group.leaderId !== actorId) {
      return fail('Only the group leader can acknowledge this assignment.');
    }
    if (findAcknowledgement(db, assignmentId, 'group', group.id)) {
      return fail('Your group has already acknowledged this assignment.');
    }
    acknowledgement = {
      assignmentId,
      subjectType: 'group',
      subjectId: group.id,
      acknowledgedBy: actorId,
      acknowledgedAt: now.toISOString(),
    };
  }

  return {
    ok: true,
    db: { ...db, acknowledgements: [...db.acknowledgements, acknowledgement] },
    acknowledgement,
  };
}
