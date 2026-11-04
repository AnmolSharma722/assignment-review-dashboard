import { describe, expect, it } from 'vitest';
import { createSeedData } from '../data/seed';
import type { Assignment } from '../types';
import {
  calcProgress,
  getAssignedStudents,
  getAssignmentProgress,
  getAssignmentsForAdmin,
  getAssignmentsForStudent,
  getOverallProgress,
  getStudentStatus,
  getStudents,
  matchesAdminFilter,
  matchesSearch,
  matchesStudentFilter,
  sortAssignments,
} from './domain';

const NOW = new Date(2026, 10, 4, 12, 0);
const db = createSeedData(NOW);
const byId = (id: string) => db.assignments.find((a) => a.id === id) as Assignment;

describe('visibility rules', () => {
  it('admins only see assignments they created', () => {
    const meera = getAssignmentsForAdmin(db, 'admin-meera');
    const rahul = getAssignmentsForAdmin(db, 'admin-rahul');
    expect(meera.length).toBeGreaterThan(0);
    expect(meera.every((a) => a.createdBy === 'admin-meera')).toBe(true);
    expect(meera.some((a) => rahul.includes(a))).toBe(false);
  });

  it('students only see assignments assigned to them (all or selected)', () => {
    const aarav = getAssignmentsForStudent(db, 'stu-aarav').map((a) => a.id);
    expect(aarav).toContain('asg-bst'); // assigned to all
    expect(aarav).toContain('asg-hash'); // selected, includes Aarav
    expect(aarav).not.toContain('asg-sorting'); // selected, excludes Aarav
    expect(aarav).not.toContain('asg-a11y');
  });

  it('resolves "selected" audiences to the right students', () => {
    const assigned = getAssignedStudents(byId('asg-sorting'), getStudents(db.users));
    expect(assigned.map((s) => s.id)).toEqual(['stu-isha', 'stu-rohan']);
  });
});

describe('status & progress', () => {
  it('derives submitted / pending / overdue', () => {
    expect(getStudentStatus(byId('asg-bst'), 'stu-aarav', db.submissions, NOW)).toBe('submitted');
    expect(getStudentStatus(byId('asg-bst'), 'stu-isha', db.submissions, NOW)).toBe('overdue');
    expect(getStudentStatus(byId('asg-graphs'), 'stu-aarav', db.submissions, NOW)).toBe('pending');
  });

  it('calculates progress safely when nothing is assigned', () => {
    expect(calcProgress(0, 0)).toEqual({ done: 0, total: 0, percent: 0 });
    expect(calcProgress(3, 5)).toEqual({ done: 3, total: 5, percent: 60 });
  });

  it('computes class completion for an assignment', () => {
    expect(getAssignmentProgress(byId('asg-bst'), db)).toEqual({ done: 3, total: 5, percent: 60 });
    expect(getAssignmentProgress(byId('asg-landing'), db)).toEqual({ done: 4, total: 5, percent: 80 });
    // Selected audience: only the two assigned students count towards the total.
    expect(getAssignmentProgress(byId('asg-sorting'), db)).toEqual({ done: 0, total: 2, percent: 0 });
  });

  it('aggregates completion across assignments', () => {
    const rahul = getAssignmentsForAdmin(db, 'admin-rahul');
    const overall = getOverallProgress(rahul, db);
    expect(overall.total).toBe(5 + 5 + 3);
    expect(overall.done).toBe(4 + 2 + 0);
  });
});

describe('search, filter and sort', () => {
  it('searches title and description, case-insensitively', () => {
    expect(matchesSearch(byId('asg-bst'), 'BINARY')).toBe(true);
    expect(matchesSearch(byId('asg-bst'), 'dijkstra')).toBe(false);
    expect(matchesSearch(byId('asg-graphs'), 'dijkstra')).toBe(true);
    expect(matchesSearch(byId('asg-bst'), '   ')).toBe(true);
  });

  it('filters by student status', () => {
    expect(matchesStudentFilter('overdue', 'not-submitted')).toBe(true);
    expect(matchesStudentFilter('pending', 'not-submitted')).toBe(true);
    expect(matchesStudentFilter('submitted', 'not-submitted')).toBe(false);
    expect(matchesStudentFilter('pending', 'overdue')).toBe(false);
  });

  it('filters admin assignments by due state and completion', () => {
    const bst = byId('asg-bst');
    expect(matchesAdminFilter(bst, getAssignmentProgress(bst, db), 'past-due', NOW)).toBe(true);
    expect(matchesAdminFilter(bst, getAssignmentProgress(bst, db), 'upcoming', NOW)).toBe(false);
    expect(matchesAdminFilter(bst, getAssignmentProgress(bst, db), 'complete', NOW)).toBe(false);

    // Once the last student (Diya) submits the landing page, it counts as complete.
    const landing = byId('asg-landing');
    const finished = {
      ...db,
      submissions: [
        ...db.submissions,
        { assignmentId: 'asg-landing', studentId: 'stu-diya', submittedAt: NOW.toISOString() },
      ],
    };
    expect(matchesAdminFilter(landing, getAssignmentProgress(landing, db), 'complete', NOW)).toBe(false);
    expect(matchesAdminFilter(landing, getAssignmentProgress(landing, finished), 'complete', NOW)).toBe(true);
  });

  it('sorts without mutating the input', () => {
    const input = [byId('asg-revision'), byId('asg-bst'), byId('asg-graphs')];
    const snapshot = [...input];
    expect(sortAssignments(input, 'due-asc', (a) => a).map((a) => a.id)).toEqual([
      'asg-bst',
      'asg-graphs',
      'asg-revision',
    ]);
    expect(sortAssignments(input, 'due-desc', (a) => a)[0].id).toBe('asg-revision');
    expect(sortAssignments(input, 'title', (a) => a).map((a) => a.title)).toEqual([
      'Binary Trees Problem Set',
      'Graph Algorithms Lab Report',
      'Midterm Revision Notes',
    ]);
    expect(input).toEqual(snapshot);
  });
});
