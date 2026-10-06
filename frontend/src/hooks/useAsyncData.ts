import { useEffect, useState } from "react";

import { apiErrorMessage } from "@/utils/apiError";

type AsyncState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

export function useAsyncData<T>(load: () => Promise<T>, deps: readonly unknown[], options?: { enabled?: boolean }): AsyncState<T> {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    load()
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setData(null);
          setError(apiErrorMessage(reason));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
    // The caller supplies the dependency list for the loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, enabled, ...deps]);

  return {
    data,
    error,
    loading,
    reload: () => setAttempt((value) => value + 1),
  };
}
