import { describe, expect, it } from 'vitest';
import { isValidHttpUrl, validateAssignment, type AssignmentFormValues } from './validation';

const NOW = new Date(2026, 10, 4, 12, 0);

const valid: AssignmentFormValues = {
  title: 'Week 5 lab',
  description: 'Complete the lab and upload it.',
  dueDate: '2026-11-20',
  driveLink: 'https://drive.google.com/drive/folders/abc',
  audience: 'all',
  selectedIds: [],
};

describe('validateAssignment', () => {
  it('accepts a valid form', () => {
    expect(validateAssignment(valid, { isNew: true, now: NOW })).toEqual({});
  });

  it('requires every text field', () => {
    const errors = validateAssignment(
      { ...valid, title: ' ', description: '', dueDate: '', driveLink: '' },
      { isNew: true, now: NOW },
    );
    expect(Object.keys(errors).sort()).toEqual(['description', 'driveLink', 'dueDate', 'title']);
  });

  it('rejects non-http(s) and malformed links', () => {
    expect(isValidHttpUrl('https://drive.google.com/x')).toBe(true);
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('not a url')).toBe(false);
  });

  it("doesn't allow a past due date when creating, but allows it when editing", () => {
    const past = { ...valid, dueDate: '2026-11-01' };
    expect(validateAssignment(past, { isNew: true, now: NOW }).dueDate).toBeDefined();
    expect(validateAssignment(past, { isNew: false, now: NOW }).dueDate).toBeUndefined();
  });

  it('requires at least one student when assigning to selected students', () => {
    const none = { ...valid, audience: 'selected' as const, selectedIds: [] };
    expect(validateAssignment(none, { isNew: true, now: NOW }).students).toBeDefined();
    const some = { ...none, selectedIds: ['stu-aarav'] };
    expect(validateAssignment(some, { isNew: true, now: NOW }).students).toBeUndefined();
  });
});
