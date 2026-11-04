"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Reads and patches the URL query so list state (filters, tab, page) survives
 * reloads and can be linked to. Callers must render inside <Suspense>
 * because useSearchParams() is used.
 */
export function useQueryParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const update = useCallback(
    (patch: Record<string, string | null | undefined>, opts: { resetPage?: boolean } = {}) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      if (opts.resetPage ?? true) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, router, pathname]
  );

  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  return { params, update, page };
}

/**
 * Search box text that is pushed to the `q` query param after a pause, so
 * typing feels instant while the URL (and the server query) follows.
 * External URL changes (e.g. the header search) flow back into the box.
 */
export function useDebouncedSearch(
  q: string,
  update: ReturnType<typeof useQueryParams>["update"],
  delay = 300
): [string, (v: string) => void] {
  const [text, setText] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  const [pushedQ, setPushedQ] = useState<string | null>(null);
  if (q !== syncedQ) {
    setSyncedQ(q);
    // Ignore the echo of our own push so ongoing typing isn't overwritten.
    if (q !== pushedQ && q.trim() !== text.trim()) setText(q);
  }

  useEffect(() => {
    const next = text.trim();
    if (next === q.trim()) return;
    const t = setTimeout(() => {
      setPushedQ(next);
      update({ q: next || null });
    }, delay);
    return () => clearTimeout(t);
  }, [text, q, update, delay]);

  return [text, setText];
}
