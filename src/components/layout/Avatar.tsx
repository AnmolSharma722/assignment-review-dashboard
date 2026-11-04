import { cn } from '../../lib/cn';

/** "Prof. Meera Iyer" -> "MI", "Aarav Mehta" -> "AM" */
export function getInitials(name: string): string {
  return name
    .replace(/^Prof\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

interface AvatarProps {
  name: string;
  role?: 'admin' | 'student';
  size?: 'sm' | 'md';
}

export function Avatar({ name, role = 'student', size = 'md' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm',
        role === 'admin'
          ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
      )}
    >
      {getInitials(name)}
    </span>
  );
}
