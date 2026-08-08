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
    primary: "bg-gradient-to-r from-[#0F4CFF] to-blue-600",
    secondary: "bg-gradient-to-r from-[#FF7A00] to-amber-500",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500",
  };

  return (
    <div className={twMerge(clsx("w-full space-y-1.5", className))} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-1">
          {label && <span>{label}</span>}
          {showValue && <span className="font-semibold text-slate-900">{clampedValue}%</span>}
        </div>
      )}
      <div className={twMerge(clsx("w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50", heightStyles[size]))}>
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
