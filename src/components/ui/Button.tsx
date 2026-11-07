import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "soft" | "default"; // added default
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  asChild?: boolean; // support asChild pattern
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  fullWidth = false,
  disabled,
  asChild,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const variantStyles = {
    primary:
      "bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-hover)] shadow-md shadow-[var(--brand-navy)]/20 focus:ring-[var(--brand-navy)]",
    secondary:
      "bg-[var(--brand-gold)] text-[var(--brand-navy)] hover:bg-[var(--brand-gold-hover)] shadow-md shadow-[var(--brand-gold)]/20 focus:ring-[var(--brand-gold)]",
    outline:
      "border border-[var(--card-border)] bg-white text-[var(--foreground)] hover:bg-[var(--muted-light)] hover:border-[var(--muted)] focus:ring-[var(--brand-navy)]",
    ghost:
      "text-[var(--muted)] hover:bg-[var(--muted-light)] hover:text-[var(--foreground)] focus:ring-[var(--muted)]",
    danger:
      "bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90 shadow-md shadow-[var(--danger)]/20 focus:ring-[var(--danger)]",
    soft:
      "bg-[var(--brand-navy-soft)] text-[var(--brand-navy)] hover:bg-[var(--brand-navy-light)]/50 focus:ring-[var(--brand-navy)]",
  };

  const sizeStyles = {
    xs: "text-[10px] px-2 py-1 gap-1 rounded-lg",
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3 gap-2.5",
    icon: "p-2.5 w-10 h-10 rounded-xl justify-center items-center",
  };

  if (asChild && React.isValidElement(children)) {
    // Clone child element to inherit button styles and props
    const child = children as React.ReactElement<{ className?: string; disabled?: boolean }>;
    const childClass = child.props.className || "";
    return React.cloneElement(child, {
      ...props,
      className: twMerge(
        clsx(
          baseStyles,
          variantStyles[variant === "default" ? "primary" : variant],
          sizeStyles[size],
          fullWidth && "w-full",
          childClass,
          className
        )
      ),
      disabled,
    });
  }

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          variantStyles[variant === "default" ? "primary" : variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )
      )}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
