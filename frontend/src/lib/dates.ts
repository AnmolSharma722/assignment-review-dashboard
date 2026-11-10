/**
 * Date helpers. Deadlines are stored as full ISO instants and displayed in the
 * viewer's local time zone. The `<input type="datetime-local">` control works
 * with local `YYYY-MM-DDTHH:mm` strings, so there are two converters for that.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const pad = (n: number) => String(n).padStart(2, '0');

/** ISO instant -> local `YYYY-MM-DDTHH:mm` (the value of a datetime-local input). */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local `YYYY-MM-DDTHH:mm` -> ISO instant. (No offset means "local time" per the spec.) */
export function fromLocalInputValue(local: string): string {
  return new Date(local).toISOString();
}

export function isValidLocalDateTime(local: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return false;
  const d = new Date(local);
  return !Number.isNaN(d.getTime()) && toLocalInputValue(d.toISOString()) === local;
}

export function isPastDeadline(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime();
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** "Due in 3 days", "Due in 5 hours", "12 minutes overdue", ... */
export function deadlineLabel(iso: string, now: Date = new Date()): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  let amount: string;
  if (abs < HOUR) amount = plural(Math.max(1, Math.floor(abs / MINUTE)), 'minute');
  else if (abs < DAY) amount = plural(Math.floor(abs / HOUR), 'hour');
  else amount = plural(Math.floor(abs / DAY), 'day');
  return diff >= 0 ? `Due in ${amount}` : `${amount} overdue`;
}
