import { useState, type FormEvent } from 'react';
import { User, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Field, describedBy, inputClass } from '../../components/ui/Field';
import { cn } from '../../lib/cn';
import { fromLocalInputValue, toLocalInputValue } from '../../lib/dates';
import {
  validateAssignment,
  type AssignmentErrors,
  type AssignmentFormValues,
} from '../../lib/validation';
import type { Assignment, AssignmentInput, SubmissionType } from '../../types';

interface AssignmentFormProps {
  /** Present when editing; absent when creating. */
  initial?: Assignment;
  /** The submission type can't change once students have acknowledged. */
  typeLocked?: boolean;
  onSubmit: (input: AssignmentInput) => void;
  onCancel: () => void;
}

const FIELD_IDS = {
  title: 'asg-title',
  description: 'asg-description',
  deadline: 'asg-deadline',
  oneDriveLink: 'asg-onedrive',
} as const;
const FIELD_ORDER = ['title', 'description', 'deadline', 'oneDriveLink'] as const;

const TYPES: { value: SubmissionType; label: string; description: string; Icon: typeof User }[] = [
  { value: 'individual', label: 'Individual', description: 'Every student acknowledges for themselves.', Icon: User },
  { value: 'group', label: 'Group', description: 'The group leader acknowledges for the whole group.', Icon: Users },
];

function toFormValues(initial?: Assignment): AssignmentFormValues {
  if (!initial) {
    return { title: '', description: '', deadline: '', oneDriveLink: '', submissionType: 'individual' };
  }
  return {
    title: initial.title,
    description: initial.description,
    deadline: toLocalInputValue(initial.deadline),
    oneDriveLink: initial.oneDriveLink,
    submissionType: initial.submissionType,
  };
}

export function AssignmentForm({ initial, typeLocked = false, onSubmit, onCancel }: AssignmentFormProps) {
  const [values, setValues] = useState<AssignmentFormValues>(() => toFormValues(initial));
  // Errors only appear after the first submit attempt, then update live as the user fixes them.
  const [attempted, setAttempted] = useState(false);

  const errors: AssignmentErrors = validateAssignment(values, { isNew: !initial });
  const shown = (key: keyof AssignmentErrors) => (attempted ? errors[key] : undefined);

  function set<K extends keyof AssignmentFormValues>(key: K, value: AssignmentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
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
      deadline: fromLocalInputValue(values.deadline),
      oneDriveLink: values.oneDriveLink.trim(),
      submissionType: values.submissionType,
    });
  }

  const titleError = shown('title');
  const descriptionError = shown('description');
  const deadlineError = shown('deadline');
  const linkError = shown('oneDriveLink');

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
        <Field
          id={FIELD_IDS.deadline}
          label="Deadline (date and time)"
          required
          error={deadlineError}
        >
          <input
            id={FIELD_IDS.deadline}
            type="datetime-local"
            value={values.deadline}
            onChange={(e) => set('deadline', e.target.value)}
            aria-required="true"
            className={inputClass(!!deadlineError)}
            {...describedBy(FIELD_IDS.deadline, deadlineError)}
          />
        </Field>

        <Field
          id={FIELD_IDS.oneDriveLink}
          label="OneDrive link"
          required
          hint="Where students upload their work."
          error={linkError}
        >
          <input
            id={FIELD_IDS.oneDriveLink}
            type="url"
            inputMode="url"
            placeholder="https://onedrive.live.com/…"
            value={values.oneDriveLink}
            onChange={(e) => set('oneDriveLink', e.target.value)}
            aria-required="true"
            className={inputClass(!!linkError)}
            {...describedBy(FIELD_IDS.oneDriveLink, linkError, 'hint')}
          />
        </Field>
      </div>

      <fieldset disabled={typeLocked}>
        <legend className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">Submission type</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {TYPES.map(({ value, label, description, Icon }) => {
            const selected = values.submissionType === value;
            return (
              <label
                key={value}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-500',
                  typeLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                  selected
                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                )}
              >
                <input
                  type="radio"
                  name="submissionType"
                  value={value}
                  checked={selected}
                  onChange={() => set('submissionType', value)}
                  className="sr-only"
                />
                <Icon
                  aria-hidden="true"
                  className={cn('mt-0.5 size-5 shrink-0', selected ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400')}
                />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-slate-600 dark:text-slate-400">{description}</span>
                </span>
              </label>
            );
          })}
        </div>
        {typeLocked && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            The submission type is locked because students have already acknowledged this assignment.
          </p>
        )}
      </fieldset>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initial ? 'Save changes' : 'Create assignment'}
        </Button>
      </div>
    </form>
  );
}
