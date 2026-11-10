import { fromLocalInputValue, isPastDeadline, isValidLocalDateTime } from './dates';
import type { Role, SubmissionType } from '../types';

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

// ---------------------------------------------------------------- auth

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export interface LoginValues {
  email: string;
  password: string;
}

export function validateLogin(values: LoginValues): FieldErrors<'email' | 'password'> {
  const errors: FieldErrors<'email' | 'password'> = {};
  if (!values.email.trim()) errors.email = 'Enter your email address.';
  else if (!isValidEmail(values.email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!values.password) errors.password = 'Enter your password.';
  return errors;
}

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role | '';
}

export function validateRegister(
  values: RegisterValues,
): FieldErrors<'name' | 'email' | 'password' | 'confirmPassword' | 'role'> {
  const errors: FieldErrors<'name' | 'email' | 'password' | 'confirmPassword' | 'role'> = {};
  const name = values.name.trim();

  if (!name) errors.name = 'Enter your full name.';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters.';
  else if (name.length > 60) errors.name = 'Name must be 60 characters or fewer.';

  if (!values.email.trim()) errors.email = 'Enter your email address.';
  else if (!isValidEmail(values.email)) errors.email = 'Enter a valid email address, like name@example.com.';

  if (!values.password) errors.password = 'Create a password.';
  else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = 'Password must include at least one letter and one number.';
  }

  if (!values.confirmPassword) errors.confirmPassword = 'Re-enter your password.';
  else if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords don't match.";

  if (!values.role) errors.role = 'Choose whether you are a student or a professor.';

  return errors;
}

// ---------------------------------------------------------------- course

export interface CourseFormValues {
  code: string;
  name: string;
  description: string;
}

export function validateCourse(values: CourseFormValues): FieldErrors<'code' | 'name' | 'description'> {
  const errors: FieldErrors<'code' | 'name' | 'description'> = {};
  const code = values.code.trim();
  const name = values.name.trim();
  const description = values.description.trim();

  if (!code) errors.code = 'Enter a course code, like CS201.';
  else if (!/^[A-Za-z0-9 -]{2,12}$/.test(code)) errors.code = 'Use 2–12 letters, numbers, spaces or hyphens.';

  if (!name) errors.name = 'Enter a course name.';
  else if (name.length < 3) errors.name = 'Course name must be at least 3 characters.';
  else if (name.length > 60) errors.name = 'Course name must be 60 characters or fewer.';

  if (!description) errors.description = 'Enter a short description.';
  else if (description.length > 240) errors.description = 'Description must be 240 characters or fewer.';

  return errors;
}

// ---------------------------------------------------------------- assignment

export interface AssignmentFormValues {
  title: string;
  description: string;
  /** Local `YYYY-MM-DDTHH:mm` straight from the datetime-local input. */
  deadline: string;
  oneDriveLink: string;
  submissionType: SubmissionType;
}

export type AssignmentErrors = FieldErrors<'title' | 'description' | 'deadline' | 'oneDriveLink'>;

/** Returns an object of error messages, empty when the form is valid. */
export function validateAssignment(
  values: AssignmentFormValues,
  options: { isNew: boolean; now?: Date },
): AssignmentErrors {
  const errors: AssignmentErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (!title) errors.title = 'Enter a title.';
  else if (title.length < 3) errors.title = 'Title must be at least 3 characters.';
  else if (title.length > 80) errors.title = 'Title must be 80 characters or fewer.';

  if (!description) errors.description = 'Enter a short description.';
  else if (description.length > 500) errors.description = 'Description must be 500 characters or fewer.';

  if (!values.deadline) errors.deadline = 'Choose a deadline date and time.';
  else if (!isValidLocalDateTime(values.deadline)) errors.deadline = 'Enter a valid date and time.';
  else if (options.isNew && isPastDeadline(fromLocalInputValue(values.deadline), options.now)) {
    errors.deadline = "The deadline can't be in the past.";
  }

  if (!values.oneDriveLink.trim()) errors.oneDriveLink = 'Paste the OneDrive link students will upload to.';
  else if (!isValidHttpUrl(values.oneDriveLink)) {
    errors.oneDriveLink = 'Enter a valid link starting with http:// or https://.';
  }

  return errors;
}

// ---------------------------------------------------------------- group

export function validateGroupName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a group name.';
  if (trimmed.length < 2) return 'Group name must be at least 2 characters.';
  if (trimmed.length > 40) return 'Group name must be 40 characters or fewer.';
  return undefined;
}
