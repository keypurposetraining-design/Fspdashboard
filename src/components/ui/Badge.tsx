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
    primary: "bg-[var(--brand-navy-soft)] text-[var(--brand-navy)] border border-[var(--brand-navy)]/20",
    secondary: "bg-[var(--brand-gold-light)] text-[var(--brand-gold-ink)] border border-[var(--brand-gold)]/20",
    success: "bg-[var(--success-light)] text-[var(--success)] border border-[var(--success-border)]/60",
    warning: "bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning-border)]/60",
    danger: "bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]/60",
    neutral: "bg-[var(--muted-light)] text-[var(--muted)] border border-[var(--muted-border)]",
    pro: "bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-navy-secondary)] text-white shadow-xs font-semibold px-2.5 py-0.5",
  };

  const dotStyles = {
    primary: "bg-[var(--brand-navy)]",
    secondary: "bg-[var(--brand-gold)]",
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    danger: "bg-[var(--danger)]",
    neutral: "bg-[var(--muted)]",
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