import { ExternalLink } from 'lucide-react';

export function OneDriveLink({ href, label = 'Open OneDrive link' }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 underline-offset-4 hover:underline dark:text-indigo-300"
    >
      {label}
      <ExternalLink aria-hidden="true" className="size-3.5" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
