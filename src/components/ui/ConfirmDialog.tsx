import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" styles the confirm button red and focuses Cancel first (safer default). */
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const danger = tone === 'danger';
  return (
    <Modal open={open} onClose={onCancel} title={title} description={description} size="sm">
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} data-autofocus={danger ? '' : undefined}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          data-autofocus={danger ? undefined : ''}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
