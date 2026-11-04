import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-xs font-medium text-[var(--muted)]">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
            {c.href && i < items.length - 1 ? (
              <Link href={c.href} className="hover:text-[var(--foreground)] hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-[var(--foreground)]">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}

/** Standard page title block: optional breadcrumbs, title, description, actions. */
export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="fsp-dot text-2xl font-bold tracking-tight text-[var(--foreground)]">{title}</h1>
          {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** A titled card section used for grouping content on detail pages. */
export function Section({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)] px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-[var(--muted)]">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Label/value rows for read-only detail views. */
export function DescriptionList({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="divide-y divide-[var(--card-border)]">
      {items.map((it) => (
        <div key={it.label} className="grid grid-cols-1 gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm font-medium text-[var(--muted)]">{it.label}</dt>
          <dd className="text-sm text-[var(--foreground)] sm:col-span-2 break-words">
            {it.value === null || it.value === undefined || it.value === "" ? (
              <span className="text-[var(--muted)]">Not provided</span>
            ) : (
              it.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
