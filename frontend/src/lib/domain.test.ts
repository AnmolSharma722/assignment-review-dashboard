import { describe, expect, it } from 'vitest';
import { createSeedData } from '../data/seed';
import type { Assignment } from '../types';
import {
  countNeedingAttention,
  getAssignmentTracking,
  getCourseCompletion,
  getCoursesForProfessor,
  getCoursesForStudent,
  getJoinableCourses,
  getStudentAssignmentState,
  getStudentCourseSummary,
  matchesProfessorFilter,
  matchesSearch,
  matchesStudentFilter,
  sortAssignments,
} from './domain';

const NOW = new Date(2026, 10, 10, 12, 0);
const db = createSeedData(NOW);
const asg = (id: string) => db.assignments.find((a) => a.id === id) as Assignment;

describe('what each user can see', () => {
  it('professors see only the courses they teach', () => {
    expect(getCoursesForProfessor(db, 'prof-meera').map((c) => c.code)).toEqual(['CS201', 'CS305']);
    expect(getCoursesForProfessor(db, 'prof-rahul').map((c) => c.code)).toEqual(['WD101', 'UX210']);
  });

  it('students see only their enrolled courses (and can find the rest to enroll in)', () => {
    expect(getCoursesForStudent(db, 'stu-isha').map((c) => c.code)).toEqual(['CS201', 'WD101', 'UX210']);
    expect(getJoinableCourses(db, 'stu-isha').map((c) => c.code)).toEqual(['CS305']);
  });
});

describe('student assignment state', () => {
  it('individual assignments are submitted / pending / overdue', () => {
    expect(getStudentAssignmentState(db, asg('asg-bst'), 'stu-aarav', NOW)).toMatchObject({
      kind: 'individual',
      status: 'submitted',
    });
    expect(getStudentAssignmentState(db, asg('asg-bst'), 'stu-isha', NOW)).toMatchObject({ status: 'overdue' });
    expect(getStudentAssignmentState(db, asg('asg-revision'), 'stu-isha', NOW)).toMatchObject({ status: 'pending' });
  });

  it('every member of a group sees the leader’s acknowledgement', () => {
    for (const member of ['stu-aarav', 'stu-diya']) {
      const state = getStudentAssignmentState(db, asg('asg-portfolio'), member, NOW);
      expect(state).toMatchObject({ kind: 'group', status: 'submitted' });
      if (state.kind === 'group') {
        expect(state.group.name).toBe('Team Pixel');
        expect(state.acknowledgedBy?.name).toBe('Aarav Mehta');
        expect(state.acknowledgement?.acknowledgedAt).toBeDefined();
      }
    }
  });

  it('knows who the leader is and who is waiting', () => {
    const leader = getStudentAssignmentState(db, asg('asg-portfolio'), 'stu-kabir', NOW);
    const member = getStudentAssignmentState(db, asg('asg-portfolio'), 'stu-isha', NOW);
    expect(leader).toMatchObject({ kind: 'group', isLeader: true, status: 'pending' });
    expect(member).toMatchObject({ kind: 'group', isLeader: false, status: 'pending' });
  });

  it('a student without a group gets the "no-group" state', () => {
    expect(getStudentAssignmentState(db, asg('asg-portfolio'), 'stu-rohan', NOW)).toEqual({
      kind: 'no-group',
      status: 'pending',
    });
  });

  it('summarises a student’s progress in a course', () => {
    // Aarav: landing page ✓, group portfolio ✓ (via Team Pixel), todo ✓
    expect(getStudentCourseSummary(db, 'crs-web', 'stu-aarav', NOW).progress).toEqual({ done: 3, total: 3, percent: 100 });
    // Diya: landing page missed (overdue), portfolio ✓ (via Team Pixel), todo pending
    const diya = getStudentCourseSummary(db, 'crs-web', 'stu-diya', NOW);
    expect(diya.progress).toEqual({ done: 1, total: 3, percent: 33 });
    expect(diya.overdue).toBe(1);
  });
});

describe('professor tracking', () => {
  it('counts students for individual assignments', () => {
    const tracking = getAssignmentTracking(db, asg('asg-bst'), NOW);
    expect(tracking.unit).toBe('student');
    expect(tracking.progress).toEqual({ done: 3, total: 5, percent: 60 });
    expect(tracking.rows.filter((r) => r.status !== 'submitted').map((r) => r.name)).toEqual(['Isha Nair', 'Rohan Gupta']);
    expect(tracking.ungroupedStudents).toEqual([]);
  });

  it('counts groups for group assignments, and flags students without a group', () => {
    const tracking = getAssignmentTracking(db, asg('asg-portfolio'), NOW);
    expect(tracking.unit).toBe('group');
    expect(tracking.progress).toEqual({ done: 1, total: 2, percent: 50 });
    const pixel = tracking.rows.find((r) => r.name === 'Team Pixel');
    expect(pixel).toMatchObject({ status: 'submitted', leader: { name: 'Aarav Mehta' }, acknowledgedBy: { name: 'Aarav Mehta' } });
    expect(pixel?.members?.map((m) => m.name)).toEqual(['Aarav Mehta', 'Diya Sharma']); // leader first
    expect(tracking.rows.find((r) => r.name === 'Byte Club')?.status).toBe('pending');
    expect(tracking.ungroupedStudents.map((s) => s.name)).toEqual(['Rohan Gupta']);
  });

  it('aggregates completion and flags what needs attention', () => {
    // WD101: landing 4/5 + portfolio 1/2 + todo 2/5 = 7/12
    expect(getCourseCompletion(db, 'crs-web', NOW)).toEqual({ done: 7, total: 12, percent: 58 });
    expect(countNeedingAttention(db, 'crs-web', NOW)).toBe(1); // only the landing page is past deadline & incomplete
  });
});

describe('search, filter and sort', () => {
  it('searches title and description, case-insensitively', () => {
    expect(matchesSearch(asg('asg-bst'), 'BINARY')).toBe(true);
    expect(matchesSearch(asg('asg-graphs'), 'dijkstra')).toBe(true);
    expect(matchesSearch(asg('asg-bst'), 'dijkstra')).toBe(false);
    expect(matchesSearch(asg('asg-bst'), '  ')).toBe(true);
  });

  it('filters by submission status', () => {
    expect(matchesStudentFilter('overdue', 'not-submitted')).toBe(true);
    expect(matchesStudentFilter('submitted', 'not-submitted')).toBe(false);
    expect(matchesStudentFilter('pending', 'overdue')).toBe(false);
  });

  it('filters a professor’s assignments by deadline and completion', () => {
    const bst = asg('asg-bst');
    const progress = getAssignmentTracking(db, bst, NOW).progress;
    expect(matchesProfessorFilter(bst, progress, 'past-deadline', NOW)).toBe(true);
    expect(matchesProfessorFilter(bst, progress, 'upcoming', NOW)).toBe(false);
    expect(matchesProfessorFilter(bst, progress, 'complete', NOW)).toBe(false);
    expect(matchesProfessorFilter(bst, { done: 5, total: 5, percent: 100 }, 'complete', NOW)).toBe(true);
  });

  it('sorts by deadline (to the minute) or title without mutating the input', () => {
    const input = [asg('asg-revision'), asg('asg-bst'), asg('asg-graphs')];
    const snapshot = [...input];
    expect(sortAssignments(input, 'deadline-asc', (a) => a).map((a) => a.id)).toEqual(['asg-bst', 'asg-graphs', 'asg-revision']);
    expect(sortAssignments(input, 'deadline-desc', (a) => a)[0].id).toBe('asg-revision');
    expect(sortAssignments(input, 'title', (a) => a).map((a) => a.title)).toEqual([
      'Binary Trees Problem Set',
      'Graph Algorithms Lab Report',
      'Midterm Revision Notes',
    ]);
    expect(input).toEqual(snapshot);
  });
});
