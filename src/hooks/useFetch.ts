import { useEffect, useState } from 'react';

export function useFetch<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fn()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.detail ?? 'Failed to load');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error };
}