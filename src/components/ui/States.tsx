"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCcw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { DataError } from "@/lib/data/errors";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} aria-hidden="true" />;
}

/** Page-level loading placeholder shaped like the content that will appear. */
export function LoadingState({
  variant = "cards",
  label = "Loading",
}: {
  variant?: "cards" | "table" | "detail" | "list";
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label}…</span>
      {variant === "cards" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </>
      )}
      {variant === "table" && (
        <div className="rounded-2xl border border-[var(--card-border)] bg-white p-4 space-y-3">
          <Skeleton className="h-10" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      )}
      {variant === "detail" && (
        <>
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </>
      )}
      {variant === "list" &&
        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
    </div>
  );
}

/** Friendly error with retry. Never renders raw database errors. */
export function ErrorState({
  title = "Something went wrong",
  error,
  message,
  onRetry,
}: {
  title?: string;
  error?: DataError | Error | null;
  message?: string;
  onRetry?: () => void;
}) {
  const unavailable = (error as DataError | undefined)?.kind === "unavailable";
  const Icon = unavailable ? Wrench : AlertCircle;
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-white px-6 py-12 text-center"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--danger-light)] text-red-700">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[var(--foreground)]">{unavailable ? "Not available yet" : title}</h3>
      <p className="mt-1 max-w-md text-sm text-[var(--muted)]">
        {message ?? error?.message ?? "We couldn't load this information."}
      </p>
      {onRetry && !unavailable && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry} icon={<RefreshCcw className="h-4 w-4" />}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Empty state with an optional call to action (button or link). */
export function EmptyPanel({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--muted-light)]/40 text-center",
        compact ? "px-4 py-8" : "px-6 py-14"
      )}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-navy-soft)] text-[var(--brand-navy)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">{description}</p>}
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="mt-5 inline-flex items-center rounded-xl bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-navy-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)] focus:ring-offset-2"
          >
            {action.label}
          </Link>
        ) : (
          <Button className="mt-5" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}
