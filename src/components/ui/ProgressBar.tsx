import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showValue = true,
  size = "md",
  color = "primary",
  className,
  ...props
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const fillColors = {
    primary: "bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-navy-secondary)]",
    secondary: "bg-gradient-to-r from-[var(--brand-gold)] to-[var(--brand-gold-hover)]",
    success: "bg-gradient-to-r from-[var(--success)] to-[var(--info)]",
    warning: "bg-gradient-to-r from-[var(--warning)] to-[var(--danger)]",
  };

  return (
    <div className={twMerge(clsx("w-full space-y-1.5", className))} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs font-medium text-[var(--muted)] mb-1">
          {label && <span>{label}</span>}
          {showValue && <span className="font-semibold text-[var(--foreground)]">{clampedValue}%</span>}
        </div>
      )}
      <div className={twMerge(clsx("w-full bg-[var(--muted-light)] rounded-full overflow-hidden p-0.5 border border-[var(--card-border)]", heightStyles[size]))}>
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500 ease-out shadow-xs",
            fillColors[color]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
