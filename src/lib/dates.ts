/**
 * Date helpers. Due dates are stored as plain `YYYY-MM-DD` strings (a calendar
 * day, not an instant) and always interpreted in the viewer's local time zone.
 * That avoids the classic "due date shifts by a day" UTC bug.
 */

const MS_PER_DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Whole calendar days from today until `iso` (negative when in the past). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Math.round absorbs the 23h / 25h days around daylight-saving changes.
  return Math.round((parseISODate(iso).getTime() - today.getTime()) / MS_PER_DAY);
}

/** An assignment is overdue from the day *after* its due date. */
export function isPastDue(iso: string, now: Date = new Date()): boolean {
  return daysUntil(iso, now) < 0;
}

export function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Human friendly relative label: "Due today", "Due in 3 days", "2 days overdue". */
export function dueLabel(iso: string, now: Date = new Date()): string {
  const days = daysUntil(iso, now);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${days} days`;
  if (days === -1) return '1 day overdue';
  return `${Math.abs(days)} days overdue`;
}
