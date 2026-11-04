import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-hover)] shadow-md shadow-[var(--brand-navy)]/20",
  outline:
    "border border-[var(--card-border)] bg-white text-[var(--foreground)] hover:bg-[var(--muted-light)] hover:border-[var(--muted)]",
  soft: "bg-[var(--brand-navy-soft)] text-[var(--brand-navy)] hover:bg-[var(--brand-navy-light)]/20",
} as const;

const SIZES = {
  sm: "text-xs px-3 py-2 gap-1.5 min-h-9",
  md: "text-sm px-4 py-2.5 gap-2 min-h-10",
} as const;

/** A Next.js link styled like Button (navigation should be a link, not a button). */
export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)] focus:ring-offset-2",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      {children}
    </Link>
  );
}
