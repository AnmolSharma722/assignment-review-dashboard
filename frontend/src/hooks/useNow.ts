import { useEffect, useState } from 'react';

/**
 * Returns the current time and refreshes it periodically, so "overdue" flags and
 * "due in N days" labels stay correct in a tab that is left open (e.g. past midnight).
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
