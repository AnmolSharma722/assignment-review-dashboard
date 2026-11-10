import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Screen-reader text. Ignored when `decorative`. */
  label?: string;
  /** Hide from assistive tech (e.g. inside a button that already says "Saving"). */
  decorative?: boolean;
}

const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-10' };

export function Spinner({ size = 'md', label = 'Loading', decorative = false }: SpinnerProps) {
  const icon = (
    <LoaderCircle
      aria-hidden="true"
      className={cn('animate-spin text-indigo-600 dark:text-indigo-400', sizes[size])}
    />
  );
  if (decorative) return icon;
  return (
    <span role="status" className="inline-flex">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}
