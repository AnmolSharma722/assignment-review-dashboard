import { describe, expect, it } from 'vitest';
import { addDays, daysUntil, dueLabel, isPastDue, parseISODate, toISODate } from './dates';

const NOW = new Date(2026, 10, 4, 15, 30); // 4 Nov 2026, mid-afternoon

describe('dates', () => {
  it('round-trips ISO dates without a time-zone shift', () => {
    expect(toISODate(parseISODate('2026-11-05'))).toBe('2026-11-05');
  });

  it('adds days across month boundaries', () => {
    expect(toISODate(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
  });

  it('counts whole calendar days regardless of the time of day', () => {
    expect(daysUntil('2026-11-04', NOW)).toBe(0);
    expect(daysUntil('2026-11-05', NOW)).toBe(1);
    expect(daysUntil('2026-11-01', NOW)).toBe(-3);
  });

  it('is only overdue from the day after the due date', () => {
    expect(isPastDue('2026-11-04', NOW)).toBe(false); // due today
    expect(isPastDue('2026-11-03', NOW)).toBe(true);
  });

  it('builds friendly relative labels', () => {
    expect(dueLabel('2026-11-04', NOW)).toBe('Due today');
    expect(dueLabel('2026-11-05', NOW)).toBe('Due tomorrow');
    expect(dueLabel('2026-11-09', NOW)).toBe('Due in 5 days');
    expect(dueLabel('2026-11-03', NOW)).toBe('1 day overdue');
    expect(dueLabel('2026-11-01', NOW)).toBe('3 days overdue');
  });
});
