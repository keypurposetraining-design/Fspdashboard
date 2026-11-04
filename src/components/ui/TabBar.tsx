"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<K extends string = string> {
  key: K;
  label: string;
  count?: number;
}

/**
 * Controlled, keyboard-accessible tab bar (WAI-ARIA tabs pattern). Scrolls
 * horizontally on narrow screens instead of wrapping.
 */
export function TabBar<K extends string>({
  tabs,
  active,
  onChange,
  label,
  idPrefix = "tab",
}: {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  label: string;
  idPrefix?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(tabs[next].key);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className="-mx-1 overflow-x-auto border-b border-[var(--card-border)]">
      <div role="tablist" aria-label={label} className="flex min-w-max gap-1 px-1">
        {tabs.map((t, i) => {
          const selected = t.key === active;
          return (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${idPrefix}-${t.key}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(t.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative -mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] rounded-t-md",
                selected
                  ? "border-[var(--brand-navy)] text-[var(--brand-navy)]"
                  : "border-transparent text-[var(--muted)] hover:border-slate-300 hover:text-[var(--foreground)]"
              )}
            >
              {t.label}
              {typeof t.count === "number" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                    selected ? "bg-[var(--brand-navy)] text-white" : "bg-[var(--muted-light)] text-[var(--muted)]"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({
  idPrefix = "tab",
  activeKey,
  children,
}: {
  idPrefix?: string;
  activeKey: string;
  children: React.ReactNode;
}) {
  return (
    <div id={`${idPrefix}-panel`} role="tabpanel" aria-labelledby={`${idPrefix}-${activeKey}`} className="pt-5">
      {children}
    </div>
  );
}
