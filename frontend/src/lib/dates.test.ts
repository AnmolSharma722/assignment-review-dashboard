import { describe, expect, it } from 'vitest';
import {
  deadlineLabel,
  fromLocalInputValue,
  isPastDeadline,
  isValidLocalDateTime,
  toLocalInputValue,
} from './dates';

const NOW = new Date(2026, 10, 4, 15, 30); // 4 Nov 2026, 3:30 pm local
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs).toISOString();

describe('datetime-local conversion', () => {
  it('round-trips a local date and time without shifting it', () => {
    expect(toLocalInputValue(fromLocalInputValue('2026-11-20T09:05'))).toBe('2026-11-20T09:05');
  });

  it('validates the datetime-local format', () => {
    expect(isValidLocalDateTime('2026-11-20T09:05')).toBe(true);
    expect(isValidLocalDateTime('2026-11-20')).toBe(false);
    expect(isValidLocalDateTime('2026-02-30T10:00')).toBe(false);
    expect(isValidLocalDateTime('2026-11-20T25:00')).toBe(false);
    expect(isValidLocalDateTime('')).toBe(false);
  });
});

describe('deadlines', () => {
  it('knows when a deadline has passed (to the minute, not the day)', () => {
    expect(isPastDeadline(at(-MIN), NOW)).toBe(true);
    expect(isPastDeadline(at(MIN), NOW)).toBe(false);
  });

  it('builds friendly relative labels', () => {
    expect(deadlineLabel(at(30 * MIN), NOW)).toBe('Due in 30 minutes');
    expect(deadlineLabel(at(3 * HOUR), NOW)).toBe('Due in 3 hours');
    expect(deadlineLabel(at(1 * DAY + 2 * HOUR), NOW)).toBe('Due in 1 day');
    expect(deadlineLabel(at(5 * DAY), NOW)).toBe('Due in 5 days');
    expect(deadlineLabel(at(-45 * MIN), NOW)).toBe('45 minutes overdue');
    expect(deadlineLabel(at(-90 * MIN), NOW)).toBe('1 hour overdue');
    expect(deadlineLabel(at(-3 * DAY), NOW)).toBe('3 days overdue');
  });
});
