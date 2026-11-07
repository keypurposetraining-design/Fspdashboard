"use client";

import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** When set, the header becomes a sort button for this sort key. */
  sortKey?: string;
  className?: string;
  /** Hide this column in the mobile card layout (e.g. the primary cell shown as card title). */
  hideOnCard?: boolean;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sort?: { key: string; desc: boolean };
  onSortChange?: (sort: { key: string; desc: boolean }) => void;
  /** Rendered as the title of each mobile card. */
  cardTitle?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  caption?: string;
  loading?: boolean;
}

/**
 * Table on md+ screens, stacked cards on small screens. Sorting is controlled
 * by the parent so it can be done server-side.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  cardTitle,
  onRowClick,
  caption,
  loading,
}: DataTableProps<T>) {
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    onSortChange(sort?.key === key ? { key, desc: !sort.desc } : { key, desc: false });
  };

  return (
    <div className={cn("transition-opacity", loading && "opacity-60")} aria-busy={loading}>
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--muted-light)]/60">
              {columns.map((c) => {
                const active = Boolean(sort && c.sortKey && sort.key === c.sortKey);
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort!.desc ? "descending" : "ascending") : undefined}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]",
                      c.className
                    )}
                  >
                    {c.sortKey && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.sortKey!)}
                        className="inline-flex items-center gap-1 uppercase hover:text-[var(--foreground)]"
                      >
                        {c.header}
                        {active ? (
                          sort!.desc ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-[var(--card-border)] last:border-0",
                  onRowClick && "cursor-pointer hover:bg-[var(--muted-light)]/50"
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-middle text-[var(--foreground)]", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className="rounded-xl border border-[var(--card-border)] bg-white p-4"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {cardTitle && <div className="mb-2 font-semibold text-[var(--foreground)]">{cardTitle(row)}</div>}
            <dl className="space-y-1.5">
              {columns
                .filter((c) => !c.hideOnCard)
                .map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3 text-sm">
                    <dt className="text-[var(--muted)]">{c.header}</dt>
                    <dd className="text-right text-[var(--foreground)]">{c.cell(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--card-border)] px-4 py-3 text-sm sm:flex-row">
      <p className="text-[var(--muted)]">
        Showing <span className="font-medium text-[var(--foreground)]">{start.toLocaleString()}</span>–
        <span className="font-medium text-[var(--foreground)]">{end.toLocaleString()}</span> of{" "}
        <span className="font-medium text-[var(--foreground)]">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--card-border)] px-3 text-sm hover:bg-[var(--muted-light)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <span className="text-[var(--muted)]">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--card-border)] px-3 text-sm hover:bg-[var(--muted-light)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
