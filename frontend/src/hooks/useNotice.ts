import { useCallback, useEffect, useRef, useState } from 'react';

/** A transient message ("Assignment created") that clears itself after a few seconds. */
export function useNotice(durationMs = 4000) {
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showNotice = useCallback(
    (message: string) => {
      clearTimeout(timer.current);
      setNotice(message);
      timer.current = setTimeout(() => setNotice(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { notice, showNotice };
}
