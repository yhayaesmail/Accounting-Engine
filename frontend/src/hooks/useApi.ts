import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.ts";

/**
 * Fetch a backend endpoint with loading/error state and cancellation.
 * Re-fetches when the path changes (e.g. journal pagination) or reload()
 * is called (e.g. retrying after a failed request).
 */
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    setLoading(true);
    setError(null);

    api
      .get<T>(path, { signal: controller.signal })
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Request failed");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [path, tick]);

  return { data, loading, error, reload };
}
