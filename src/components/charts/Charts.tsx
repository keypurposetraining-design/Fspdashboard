"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Table2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusIconGlyph, TONE_ICON_CLASSES } from "@/components/ui/StatusBadge";
import type { StatusIcon, Tone } from "@/lib/status";

/*
 * Dependency-free SVG charts following the dataviz method:
 *  - series colours validated with the palette validator (light surface #fff):
 *    blue #2a78d6 (slot 1), status green #008300, status red #e34948.
 *    Green/red sit in the CVD 6–8 band, so every multi-series chart ships a
 *    legend, per-bar tooltips and a table view as secondary encoding.
 *  - thin columns (<= 24px), 4px rounded data-end, square baseline,
 *    2px surface gap between grouped bars, hairline solid gridlines.
 *  - text always uses text tokens, never the series colour.
 */

export const SERIES_COLORS = {
  blue: "#2a78d6",
  green: "#008300",
  red: "#e34948",
  orange: "#eb6834",
} as const;

export interface Series {
  key: string;
  label: string;
  color: string;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

function niceMax(v: number) {
  if (v <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Rounded-top rect path: 4px radius at the data end, square at the baseline. */
function columnPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

/**
 * Column chart for counts over time. One or more series (grouped).
 * `data` rows carry a `label` plus a numeric field per series key.
 */
export function ColumnChart({
  data,
  series,
  height = 240,
  valueLabel = "Count",
}: {
  data: ({ label: string } & Record<string, number | string>)[];
  series: Series[];
  height?: number;
  valueLabel?: string;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

  const padL = 36, padR = 8, padT = 12, padB = 28;
  const innerW = Math.max(0, width - padL - padR);
  const innerH = height - padT - padB;
  const max = niceMax(Math.max(0, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0))));
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];

  const band = data.length ? innerW / data.length : 0;
  const gap = 2;
  const barW = Math.max(2, Math.min(24, (band * 0.7 - gap * (series.length - 1)) / series.length));
  const groupW = barW * series.length + gap * (series.length - 1);
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerW / 56))));

  return (
    <div>
      {series.length > 1 && <Legend series={series} />}
      <div ref={ref} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={`${valueLabel} by period`}>
            {ticks.map((t) => {
              const y = padT + innerH - (t / max) * innerH;
              return (
                <g key={t}>
                  <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="var(--card-border)" strokeWidth={1} />
                  <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px]">
                    {Number.isInteger(t) ? t.toLocaleString() : ""}
                  </text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const gx = padL + i * band + (band - groupW) / 2;
              return (
                <g key={d.label}>
                  {series.map((s, si) => {
                    const v = Number(d[s.key]) || 0;
                    const h = (v / max) * innerH;
                    const x = gx + si * (barW + gap);
                    return v > 0 ? (
                      <path key={s.key} d={columnPath(x, padT + innerH - h, barW, h)} fill={s.color} />
                    ) : null;
                  })}
                  {i % labelEvery === 0 && (
                    <text
                      x={padL + i * band + band / 2}
                      y={height - 8}
                      textAnchor="middle"
                      className="fill-slate-500 text-[11px]"
                    >
                      {d.label}
                    </text>
                  )}
                  {/* Hit target: the whole band, larger than the marks. */}
                  <rect
                    x={padL + i * band}
                    y={padT}
                    width={band}
                    height={innerH}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${d.label}: ${series.map((s) => `${s.label} ${d[s.key] ?? 0}`).join(", ")}`}
                    onMouseEnter={() => setHover({ i, x: padL + i * band + band / 2, y: padT })}
                    onFocus={() => setHover({ i, x: padL + i * band + band / 2, y: padT })}
                    onMouseLeave={() => setHover(null)}
                    onBlur={() => setHover(null)}
                    className="outline-none focus:fill-slate-100/40"
                  />
                </g>
              );
            })}
            <line x1={padL} x2={width - padR} y1={padT + innerH} y2={padT + innerH} stroke="var(--muted-border)" strokeWidth={1} />
          </svg>
        )}
        {hover && data[hover.i] && (
          <div
            className="pointer-events-none absolute z-10 min-w-[140px] -translate-x-1/2 rounded-lg border border-[var(--card-border)] bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: Math.min(Math.max(hover.x, 70), width - 70), top: hover.y }}
          >
            <p className="mb-1 font-semibold text-[var(--foreground)]">{data[hover.i].label}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-3 text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-semibold text-[var(--foreground)]">
                  {(Number(data[hover.i][s.key]) || 0).toLocaleString()}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Legend({ series }: { series: Series[] }) {
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  tone: Tone;
  icon: StatusIcon;
  href?: string;
}

const BAR_FILL: Record<Tone, string> = {
  success: "bg-emerald-600",
  warning: "bg-[var(--brand-gold)]",
  danger: "bg-red-500",
  info: "bg-[var(--brand-navy)]",
  neutral: "bg-slate-400",
};

/**
 * Horizontal status breakdown: icon + label + count + share, with a bar.
 * Used instead of a donut: lengths on a common baseline compare more
 * accurately than angles, and every row is labelled.
 */
export function BarList({ items, total }: { items: BarListItem[]; total?: number }) {
  const sum = total ?? items.reduce((a, b) => a + b.value, 0);
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((it) => {
        const pct = sum > 0 ? Math.round((it.value / sum) * 100) : 0;
        const row = (
          <>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", TONE_ICON_CLASSES[it.tone])}>
                  <StatusIconGlyph icon={it.icon} className="h-3.5 w-3.5" />
                </span>
                {it.label}
              </span>
              <span className="tabular-nums text-[var(--muted)]">
                <span className="font-semibold text-[var(--foreground)]">{it.value.toLocaleString()}</span>
                {sum > 0 && <span className="ml-1.5 text-xs">({pct}%)</span>}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className={cn("h-2 rounded-full", BAR_FILL[it.tone])}
                style={{ width: `${(it.value / max) * 100}%`, minWidth: it.value > 0 ? 4 : 0 }}
              />
            </div>
          </>
        );
        return (
          <li key={it.key}>
            {it.href ? (
              <Link href={it.href} className="block rounded-lg p-1 -m-1 hover:bg-[var(--muted-light)]/60">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Chart container with a title and a chart/table toggle so every value is
 * available as text. Shows `empty` when there is no data to plot.
 */
export function ChartCard({
  title,
  description,
  table,
  isEmpty,
  empty,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  table: { columns: string[]; rows: (string | number)[][] };
  isEmpty?: boolean;
  empty?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={cn("rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-xs", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-[var(--muted)]">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {!isEmpty && (
            <button
              type="button"
              onClick={() => setShowTable((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--muted-light)] hover:text-[var(--foreground)]"
              aria-pressed={showTable}
            >
              {showTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
              {showTable ? "Chart" : "Table"}
            </button>
          )}
        </div>
      </div>
      {isEmpty ? (
        empty ?? <p className="py-10 text-center text-sm text-[var(--muted)]">No data for this period yet.</p>
      ) : showTable ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                {table.columns.map((c, i) => (
                  <th key={c} className={cn("py-2 pr-3 font-semibold", i > 0 && "text-right")}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, ri) => (
                <tr key={ri} className="border-b border-[var(--card-border)] last:border-0">
                  {r.map((cell, ci) => (
                    <td key={ci} className={cn("py-2 pr-3", ci > 0 && "text-right tabular-nums")}>
                      {typeof cell === "number" ? cell.toLocaleString() : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

/** KPI tile: label, value, optional context line and link. No fabricated trends. */
export function KpiCard({
  label,
  value,
  context,
  icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number | string;
  context?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {context && <p className="mt-1 text-xs text-[var(--muted)]">{context}</p>}
      </div>
      {icon && (
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_ICON_CLASSES[tone])}>
          {icon}
        </span>
      )}
    </div>
  );
  const cls =
    "block rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-xs transition-shadow";
  return href ? (
    <Link href={href} className={cn(cls, "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function monthLabel(iso: string) {
  // Parse YYYY-MM-DD as a local date so the month never shifts across time zones.
  const [y, m] = iso.slice(0, 10).split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}
