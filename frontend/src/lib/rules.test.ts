import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, createSeedData } from '../data/seed';
import type { AssignmentInput } from '../types';
import {
  acknowledgeAssignment,
  authenticate,
  createAssignment,
  createCourse,
  createGroup,
  deleteAssignment,
  enrollStudent,
  joinGroup,
  registerUser,
  updateAssignment,
  type Result,
} from './rules';

const NOW = new Date(2026, 10, 10, 12, 0);
const db = createSeedData(NOW);

/** Unwraps a successful Result (failing the test with the error message otherwise). */
function ok<T extends object>(result: Result<T>) {
  if (!result.ok) throw new Error(`Expected success but got: ${result.error}`);
  return result;
}
function error(result: Result<object>): string {
  if (result.ok) throw new Error('Expected a failure but the rule succeeded');
  return result.error;
}

const input: AssignmentInput = {
  title: 'New task',
  description: 'Do the thing.',
  deadline: new Date(NOW.getTime() + 86_400_000).toISOString(),
  oneDriveLink: 'https://onedrive.live.com/?id=x',
  submissionType: 'individual',
};

describe('accounts', () => {
  it('registers a user with a hashed password and rejects duplicate emails (any case)', () => {
    const created = ok(registerUser(db, { name: ' Neha Kapoor ', email: 'Neha@Example.com', password: 'Secret123', role: 'student' }, NOW));
    expect(created.user.name).toBe('Neha Kapoor');
    expect(created.user.email).toBe('neha@example.com');
    expect(created.user.passwordHash).not.toContain('Secret123');
    expect(created.db.users).toHaveLength(db.users.length + 1);

    const duplicate = registerUser(created.db, { name: 'Other', email: 'NEHA@example.com', password: 'Secret123', role: 'professor' });
    expect(error(duplicate)).toMatch(/already exists/i);
  });

  it('authenticates only the right email + password pair', () => {
    expect(authenticate(db, 'AARAV.mehta@student.edu', DEMO_PASSWORD)?.id).toBe('stu-aarav');
    expect(authenticate(db, 'aarav.mehta@student.edu', 'wrong-password')).toBeNull();
    expect(authenticate(db, 'nobody@student.edu', DEMO_PASSWORD)).toBeNull();
  });
});

describe('courses', () => {
  it('lets a professor create a course (unique code) and students enroll once', () => {
    const created = ok(createCourse(db, 'prof-meera', { code: 'cs999', name: 'Compilers', description: 'Parsing.' }, NOW));
    expect(created.course.code).toBe('CS999');
    expect(created.course.professorId).toBe('prof-meera');
    expect(error(createCourse(created.db, 'prof-rahul', { code: 'CS999', name: 'X', description: 'Y' }))).toMatch(/already exists/);
    expect(error(createCourse(db, 'stu-aarav', { code: 'ZZ1', name: 'X', description: 'Y' }))).toMatch(/professors/);

    const enrolled = ok(enrollStudent(created.db, created.course.id, 'stu-aarav'));
    expect(enrolled.db.courses.find((c) => c.id === created.course.id)?.enrolledStudentIds).toEqual(['stu-aarav']);
    expect(error(enrollStudent(enrolled.db, created.course.id, 'stu-aarav'))).toMatch(/already enrolled/);
    expect(error(enrollStudent(db, 'crs-ds', 'prof-meera'))).toMatch(/students/);
  });
});

describe('assignments', () => {
  it('only the course professor can create, edit or delete', () => {
    const created = ok(createAssignment(db, 'prof-meera', 'crs-ds', input, NOW));
    expect(created.assignment.courseId).toBe('crs-ds');
    expect(created.assignment.createdBy).toBe('prof-meera');

    expect(error(createAssignment(db, 'prof-rahul', 'crs-ds', input))).toMatch(/courses you teach/);
    expect(error(updateAssignment(db, 'prof-rahul', 'asg-bst', input))).toMatch(/courses you teach/);
    expect(error(deleteAssignment(db, 'prof-rahul', 'asg-bst'))).toMatch(/courses you teach/);
  });

  it("won't change the submission type once someone has acknowledged", () => {
    // asg-portfolio (group) already has an acknowledgement from Team Pixel.
    const toIndividual = { ...input, submissionType: 'individual' as const };
    expect(error(updateAssignment(db, 'prof-rahul', 'asg-portfolio', toIndividual))).toMatch(/can't be changed/);
    // Same type is fine, and so is changing the type of an assignment nobody has acknowledged.
    ok(updateAssignment(db, 'prof-rahul', 'asg-portfolio', { ...input, submissionType: 'group' }));
    ok(updateAssignment(db, 'prof-rahul', 'asg-a11y', { ...input, submissionType: 'individual' }));
  });

  it('deleting an assignment also deletes its acknowledgements', () => {
    const result = ok(deleteAssignment(db, 'prof-meera', 'asg-bst'));
    expect(result.db.assignments.some((a) => a.id === 'asg-bst')).toBe(false);
    expect(result.db.acknowledgements.some((a) => a.assignmentId === 'asg-bst')).toBe(false);
    expect(result.db.acknowledgements.length).toBeLessThan(db.acknowledgements.length);
  });
});

describe('groups', () => {
  it('the creator becomes the leader and the only member', () => {
    const { group } = ok(createGroup(db, 'stu-rohan', 'crs-web', '  Rocket Squad ', NOW));
    expect(group).toMatchObject({ name: 'Rocket Squad', leaderId: 'stu-rohan', memberIds: ['stu-rohan'], courseId: 'crs-web' });
  });

  it('enforces one group per course, unique names and enrolment', () => {
    expect(error(createGroup(db, 'stu-aarav', 'crs-web', 'Another'))).toMatch(/already in a group/);
    expect(error(createGroup(db, 'stu-rohan', 'crs-web', 'team pixel'))).toMatch(/already exists/);
    expect(error(createGroup(db, 'stu-rohan', 'crs-algo', 'Algo Crew'))).toMatch(/enrolled/);
    expect(error(createGroup(db, 'stu-rohan', 'crs-web', ' '))).toMatch(/group name/i);
  });

  it('lets a student join a group once', () => {
    const joined = ok(joinGroup(db, 'stu-rohan', 'grp-byte'));
    expect(joined.group.memberIds).toEqual(['stu-kabir', 'stu-isha', 'stu-rohan']);
    expect(joined.group.leaderId).toBe('stu-kabir'); // leadership doesn't change
    expect(error(joinGroup(joined.db, 'stu-rohan', 'grp-pixel'))).toMatch(/already in a group/);
    expect(error(joinGroup(db, 'stu-kabir', 'grp-allies'))).toMatch(/enrolled|already in a group/);
  });
});

describe('acknowledging', () => {
  it('individual: records who and when, once only', () => {
    const result = ok(acknowledgeAssignment(db, 'stu-aarav', 'asg-graphs', NOW));
    expect(result.acknowledgement).toEqual({
      assignmentId: 'asg-graphs',
      subjectType: 'student',
      subjectId: 'stu-aarav',
      acknowledgedBy: 'stu-aarav',
      acknowledgedAt: NOW.toISOString(),
    });
    expect(error(acknowledgeAssignment(result.db, 'stu-aarav', 'asg-graphs'))).toMatch(/already acknowledged/);
  });

  it('group: only the leader can acknowledge, and it counts for the whole group', () => {
    // Isha is a plain member of Byte Club (leader: Kabir).
    expect(error(acknowledgeAssignment(db, 'stu-isha', 'asg-portfolio'))).toBe(
      'Only the group leader can acknowledge this assignment.',
    );

    const result = ok(acknowledgeAssignment(db, 'stu-kabir', 'asg-portfolio', NOW));
    expect(result.acknowledgement).toMatchObject({
      subjectType: 'group',
      subjectId: 'grp-byte',
      acknowledgedBy: 'stu-kabir',
      acknowledgedAt: NOW.toISOString(),
    });
    expect(error(acknowledgeAssignment(result.db, 'stu-kabir', 'asg-portfolio'))).toMatch(/already acknowledged/);
  });

  it('group: a student with no group cannot acknowledge', () => {
    expect(error(acknowledgeAssignment(db, 'stu-rohan', 'asg-portfolio'))).toBe(
      'You are not part of any group. Create or join one to submit this assignment.',
    );
  });

  it('only enrolled students can acknowledge', () => {
    expect(error(acknowledgeAssignment(db, 'stu-isha', 'asg-graphs'))).toMatch(/enrolled/); // not in CS305
    expect(error(acknowledgeAssignment(db, 'prof-meera', 'asg-graphs'))).toMatch(/students/);
    expect(error(acknowledgeAssignment(db, 'stu-aarav', 'asg-missing'))).toMatch(/no longer exists/);
  });
});
