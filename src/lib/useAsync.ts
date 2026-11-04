"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toDataError, type DataError } from "@/lib/data/errors";

export interface AsyncState<T> {
  data: T | undefined;
  error: DataError | null;
  loading: boolean;
  /** Re-runs the loader; keeps showing current data while refreshing. */
  reload: () => void;
  setData: (updater: T | ((prev: T | undefined) => T)) => void;
}

/**
 * Runs an async loader on mount and whenever `deps` change. Stale responses
 * from earlier runs are ignored, so fast filter changes can't show old data.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = [], enabled = true): AsyncState<T> {
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<DataError | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [tick, setTick] = useState(0);
  const runId = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const id = ++runId.current;
    let cancelled = false;
    // Loading/error flags are reset inside the async task, not synchronously in the effect body.
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined;
        setLoading(true);
        setError(null);
        return loader();
      })
      .then((result) => {
        if (!cancelled && id === runId.current && result !== undefined) setDataState(result as T);
      })
      .catch((e) => {
        if (!cancelled && id === runId.current) setError(toDataError(e, "useAsync"));
      })
      .finally(() => {
        if (!cancelled && id === runId.current) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater: T | ((prev: T | undefined) => T)) => {
    setDataState((prev) =>
      typeof updater === "function" ? (updater as (p: T | undefined) => T)(prev) : updater
    );
  }, []);

  return { data, error, loading, reload, setData };
}
