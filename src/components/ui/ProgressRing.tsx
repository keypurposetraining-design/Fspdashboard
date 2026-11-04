import React from "react";

/**
 * Circular progress indicator. The unfilled track is a light step of the same
 * hue; the percentage is always printed in the centre (never colour alone).
 */
export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = v >= 100 ? "var(--success)" : v >= 60 ? "var(--brand-navy)" : "var(--warning)";
  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card-border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: "stroke-dashoffset 400ms ease-out" }}
        />
      </svg>
      <span className="absolute text-lg font-bold text-[var(--foreground)]">{v}%</span>
    </div>
  );
}

/** Flat progress bar with a text label (for use inside cards and lists). */
export function ProgressLine({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--muted)]">{label}</span>
          <span className="font-semibold text-[var(--foreground)]">{v}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className={v >= 100 ? "h-full rounded-full bg-emerald-600" : "h-full rounded-full bg-[var(--brand-navy)]"}
          style={{ width: `${v}%`, transition: "width 400ms ease-out" }}
        />
      </div>
    </div>
  );
}
