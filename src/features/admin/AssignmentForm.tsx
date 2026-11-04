import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, describedBy, inputClass } from '../../components/ui/Field';
import { cn } from '../../lib/cn';
import {
  validateAssignment,
  type AssignmentErrors,
  type AssignmentFormValues,
} from '../../lib/validation';
import type { Assignment, AssignmentInput, User } from '../../types';

interface AssignmentFormProps {
  /** Present when editing; absent when creating. */
  initial?: Assignment;
  students: User[];
  onSubmit: (input: AssignmentInput) => void;
  onCancel: () => void;
}

const FIELD_IDS = {
  title: 'asg-title',
  description: 'asg-description',
  dueDate: 'asg-due-date',
  driveLink: 'asg-drive-link',
  students: 'asg-student-0',
} as const;

const FIELD_ORDER = ['title', 'description', 'dueDate', 'driveLink', 'students'] as const;

function toFormValues(initial?: Assignment): AssignmentFormValues {
  if (!initial) {
    return { title: '', description: '', dueDate: '', driveLink: '', audience: 'all', selectedIds: [] };
  }
  return {
    title: initial.title,
    description: initial.description,
    dueDate: initial.dueDate,
    driveLink: initial.driveLink,
    audience: initial.assignedTo === 'all' ? 'all' : 'selected',
    selectedIds: initial.assignedTo === 'all' ? [] : initial.assignedTo,
  };
}

export function AssignmentForm({ initial, students, onSubmit, onCancel }: AssignmentFormProps) {
  const [values, setValues] = useState<AssignmentFormValues>(() => toFormValues(initial));
  // Errors only appear after the first submit attempt, then update live as the user fixes them.
  const [attempted, setAttempted] = useState(false);

  const errors: AssignmentErrors = validateAssignment(values, { isNew: !initial });
  const shown = (key: keyof AssignmentErrors) => (attempted ? errors[key] : undefined);

  function set<K extends keyof AssignmentFormValues>(key: K, value: AssignmentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleStudent(id: string) {
    set(
      'selectedIds',
      values.selectedIds.includes(id)
        ? values.selectedIds.filter((s) => s !== id)
        : [...values.selectedIds, id],
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);

    const firstInvalid = FIELD_ORDER.find((key) => errors[key]);
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }

    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      dueDate: values.dueDate,
      driveLink: values.driveLink.trim(),
      assignedTo: values.audience === 'all' ? 'all' : values.selectedIds,
    });
  }

  const titleError = shown('title');
  const descriptionError = shown('description');
  const dueDateError = shown('dueDate');
  const driveError = shown('driveLink');
  const studentsError = shown('students');

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id={FIELD_IDS.title} label="Title" required error={titleError}>
        <input
          id={FIELD_IDS.title}
          type="text"
          data-autofocus=""
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          maxLength={80}
          aria-required="true"
          className={inputClass(!!titleError)}
          {...describedBy(FIELD_IDS.title, titleError)}
        />
      </Field>

      <Field id={FIELD_IDS.description} label="Description" required error={descriptionError}>
        <textarea
          id={FIELD_IDS.description}
          rows={3}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={500}
          aria-required="true"
          className={inputClass(!!descriptionError)}
          {...describedBy(FIELD_IDS.description, descriptionError)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={FIELD_IDS.dueDate} label="Due date" required error={dueDateError}>
          <input
            id={FIELD_IDS.dueDate}
            type="date"
            value={values.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
            aria-required="true"
            className={inputClass(!!dueDateError)}
            {...describedBy(FIELD_IDS.dueDate, dueDateError)}
          />
        </Field>

        <Field
          id={FIELD_IDS.driveLink}
          label="Google Drive link"
          required
          hint="Where students upload their work."
          error={driveError}
        >
          <input
            id={FIELD_IDS.driveLink}
            type="url"
            inputMode="url"
            placeholder="https://drive.google.com/…"
            value={values.driveLink}
            onChange={(e) => set('driveLink', e.target.value)}
            aria-required="true"
            className={inputClass(!!driveError)}
            {...describedBy(FIELD_IDS.driveLink, driveError, 'hint')}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">Assign to</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {(
            [
              ['all', `All students (${students.length})`],
              ['selected', 'Selected students'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="audience"
                value={value}
                checked={values.audience === value}
                onChange={() => set('audience', value)}
                className="size-4 accent-indigo-600"
              />
              {label}
            </label>
          ))}
        </div>

        {values.audience === 'selected' && (
          <div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {values.selectedIds.length} of {students.length} selected
              </p>
              <button
                type="button"
                onClick={() =>
                  set(
                    'selectedIds',
                    values.selectedIds.length === students.length ? [] : students.map((s) => s.id),
                  )
                }
                className="text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300"
              >
                {values.selectedIds.length === students.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <ul className="grid gap-1 sm:grid-cols-2">
              {students.map((student, index) => (
                <li key={student.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input
                      id={`asg-student-${index}`}
                      type="checkbox"
                      checked={values.selectedIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="size-4 accent-indigo-600"
                    />
                    {student.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
        {studentsError && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
            {studentsError}
          </p>
        )}
      </fieldset>

      <div className={cn('flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end')}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initial ? 'Save changes' : 'Create assignment'}
        </Button>
      </div>
    </form>
  );
}
