import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, describedBy, inputClass } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { useCurrentUser } from '../../context/AuthContext';
import { useReadyData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { validateCourse, type CourseFormValues } from '../../lib/validation';

const EMPTY: CourseFormValues = { code: '', name: '', description: '' };

function CourseForm({ onDone }: { onDone: () => void }) {
  const user = useCurrentUser();
  const { createCourse } = useReadyData();
  const { toast } = useToast();
  const [values, setValues] = useState<CourseFormValues>(EMPTY);
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = validateCourse(values);
  const shown = (key: keyof CourseFormValues) => (attempted ? errors[key] : undefined);
  const set = (key: keyof CourseFormValues, value: string) => setValues((v) => ({ ...v, [key]: value }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setServerError(null);
    const first = (['code', 'name', 'description'] as const).find((k) => errors[k]);
    if (first) {
      document.getElementById(`course-${first}`)?.focus();
      return;
    }
    const outcome = createCourse(user.id, values);
    if (!outcome.ok) {
      setServerError(outcome.error);
      document.getElementById('course-code')?.focus();
      return;
    }
    toast(`${outcome.course.code} · ${outcome.course.name} created.`);
    onDone();
  }

  const codeError = shown('code') ?? serverError ?? undefined;
  const nameError = shown('name');
  const descriptionError = shown('description');

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <Field id="course-code" label="Course code" required error={codeError}>
          <input
            id="course-code"
            type="text"
            data-autofocus=""
            placeholder="CS201"
            value={values.code}
            onChange={(e) => set('code', e.target.value)}
            aria-required="true"
            className={inputClass(!!codeError)}
            {...describedBy('course-code', codeError)}
          />
        </Field>
        <Field id="course-name" label="Course name" required error={nameError}>
          <input
            id="course-name"
            type="text"
            placeholder="Data Structures"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            aria-required="true"
            className={inputClass(!!nameError)}
            {...describedBy('course-name', nameError)}
          />
        </Field>
      </div>
      <Field id="course-description" label="Description" required error={descriptionError}>
        <textarea
          id="course-description"
          rows={3}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          aria-required="true"
          className={inputClass(!!descriptionError)}
          {...describedBy('course-description', descriptionError)}
        />
      </Field>
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">
          Create course
        </Button>
      </div>
    </form>
  );
}

export function CourseFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a course"
      description="Students can then enroll in it from their dashboard."
    >
      {/* Mounted only while open, so the form always starts empty. */}
      <CourseForm onDone={onClose} />
    </Modal>
  );
}
