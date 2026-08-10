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
      "bg-[#0F4CFF] text-white hover:bg-[#0D41DB] shadow-md shadow-blue-500/20 focus:ring-[#0F4CFF]",
    secondary:
      "bg-[#FF7A00] text-white hover:bg-[#E06C00] shadow-md shadow-orange-500/20 focus:ring-[#FF7A00]",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-[#0F4CFF]",
    ghost:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/20 focus:ring-rose-600",
    soft:
      "bg-blue-50 text-[#0F4CFF] hover:bg-blue-100 focus:ring-[#0F4CFF]",
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
    const child = children as React.ReactElement<any>;
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
    } as any);
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
