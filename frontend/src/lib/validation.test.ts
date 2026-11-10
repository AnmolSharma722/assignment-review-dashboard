import { describe, expect, it } from 'vitest';
import {
  isValidEmail,
  isValidHttpUrl,
  validateAssignment,
  validateCourse,
  validateGroupName,
  validateLogin,
  validateRegister,
  type AssignmentFormValues,
  type RegisterValues,
} from './validation';

const NOW = new Date(2026, 10, 4, 12, 0);

describe('login', () => {
  it('requires a valid email and a password', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Enter your email address.',
      password: 'Enter your password.',
    });
    expect(validateLogin({ email: 'nope', password: 'x' }).email).toMatch(/valid email/i);
    expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual({});
  });

  it('checks email shape', () => {
    expect(isValidEmail('name@example.com')).toBe(true);
    expect(isValidEmail('name@example')).toBe(false);
    expect(isValidEmail('a b@example.com')).toBe(false);
  });
});

describe('register', () => {
  const valid: RegisterValues = {
    name: 'Neha Kapoor',
    email: 'neha@example.com',
    password: 'Secret123',
    confirmPassword: 'Secret123',
    role: 'student',
  };

  it('accepts a valid form', () => {
    expect(validateRegister(valid)).toEqual({});
  });

  it('requires every field including a role', () => {
    const errors = validateRegister({ name: '', email: '', password: '', confirmPassword: '', role: '' });
    expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'email', 'name', 'password', 'role']);
  });

  it('enforces password strength and confirmation', () => {
    expect(validateRegister({ ...valid, password: 'short1', confirmPassword: 'short1' }).password).toMatch(/8 characters/);
    expect(validateRegister({ ...valid, password: 'onlyletters', confirmPassword: 'onlyletters' }).password).toMatch(/letter and one number/);
    expect(validateRegister({ ...valid, confirmPassword: 'Different1' }).confirmPassword).toMatch(/match/);
  });
});

describe('course', () => {
  it('validates code, name and description', () => {
    expect(validateCourse({ code: 'CS201', name: 'Data Structures', description: 'Trees and graphs.' })).toEqual({});
    expect(Object.keys(validateCourse({ code: '', name: '', description: '' })).sort()).toEqual([
      'code',
      'description',
      'name',
    ]);
    expect(validateCourse({ code: 'bad!code', name: 'Data', description: 'x' }).code).toBeDefined();
  });
});

describe('assignment', () => {
  const valid: AssignmentFormValues = {
    title: 'Week 5 lab',
    description: 'Complete the lab and upload it.',
    deadline: '2026-11-20T09:30',
    oneDriveLink: 'https://onedrive.live.com/?id=abc',
    submissionType: 'individual',
  };

  it('accepts a valid form', () => {
    expect(validateAssignment(valid, { isNew: true, now: NOW })).toEqual({});
  });

  it('requires every field', () => {
    const errors = validateAssignment(
      { ...valid, title: ' ', description: '', deadline: '', oneDriveLink: '' },
      { isNew: true, now: NOW },
    );
    expect(Object.keys(errors).sort()).toEqual(['deadline', 'description', 'oneDriveLink', 'title']);
  });

  it('rejects non-http(s) and malformed links', () => {
    expect(isValidHttpUrl('https://onedrive.live.com/x')).toBe(true);
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('not a url')).toBe(false);
  });

  it('rejects a past deadline when creating (time included) but allows it when editing', () => {
    const past = { ...valid, deadline: '2026-11-04T11:59' }; // one minute before NOW
    expect(validateAssignment(past, { isNew: true, now: NOW }).deadline).toMatch(/past/);
    expect(validateAssignment(past, { isNew: false, now: NOW }).deadline).toBeUndefined();
    const later = { ...valid, deadline: '2026-11-04T12:01' };
    expect(validateAssignment(later, { isNew: true, now: NOW }).deadline).toBeUndefined();
  });
});

describe('group name', () => {
  it('requires 2-40 characters', () => {
    expect(validateGroupName('')).toBeDefined();
    expect(validateGroupName('A')).toBeDefined();
    expect(validateGroupName('x'.repeat(41))).toBeDefined();
    expect(validateGroupName('Team Pixel')).toBeUndefined();
  });
});
