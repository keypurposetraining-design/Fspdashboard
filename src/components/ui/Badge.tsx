import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral" | "pro";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  dot = false,
  ...props
}) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full tracking-tight transition-colors";

  const variantStyles = {
    primary: "bg-blue-50 text-[#0F4CFF] border border-blue-200/60",
    secondary: "bg-orange-50 text-[#FF7A00] border border-orange-200/60",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/60",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/60",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    pro: "bg-gradient-to-r from-[#0F4CFF] to-blue-700 text-white shadow-xs font-semibold px-2.5 py-0.5",
  };

  const dotStyles = {
    primary: "bg-[#0F4CFF]",
    secondary: "bg-[#FF7A00]",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-slate-400",
    pro: "bg-white",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span
      className={twMerge(
        clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full shrink-0 animate-pulse",
            dotStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
