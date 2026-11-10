import { isPastDue, parseISODate, toISODate } from './dates';

export interface AssignmentFormValues {
  title: string;
  description: string;
  dueDate: string;
  driveLink: string;
  audience: 'all' | 'selected';
  selectedIds: string[];
}

export type AssignmentErrors = Partial<
  Record<'title' | 'description' | 'dueDate' | 'driveLink' | 'students', string>
>;

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toISODate(parseISODate(value)) === value;
}

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

  if (!values.dueDate) errors.dueDate = 'Choose a due date.';
  else if (!isValidISODate(values.dueDate)) errors.dueDate = 'Enter a valid date.';
  else if (options.isNew && isPastDue(values.dueDate, options.now)) {
    errors.dueDate = "Due date can't be in the past.";
  }

  if (!values.driveLink.trim()) errors.driveLink = 'Paste the Drive link students will upload to.';
  else if (!isValidHttpUrl(values.driveLink)) {
    errors.driveLink = 'Enter a valid link starting with http:// or https://.';
  }

  if (values.audience === 'selected' && values.selectedIds.length === 0) {
    errors.students = 'Select at least one student.';
  }

  return errors;
}
