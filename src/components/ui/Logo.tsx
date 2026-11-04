"use client";

import React from "react";
import Image from "next/image";

export interface LogoProps {
  /** Variant of the logo */
  variant?: "full" | "icon" | "text" | "compact";
  /** Size of the logo */
  size?: "sm" | "md" | "lg" | "xl";
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Whether to show brand text alongside icon (for full/text variants) */
  showText?: boolean;
  /** Whether to show "FSP" brand text in compact variant */
  showBrandText?: boolean;
}

/**
 * Official FSP Logo component
 * Uses the official FSP logo asset from /public/fsp-logo.png
 * Supports multiple variants for different use cases
 */
export const Logo: React.FC<LogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  alt = "FSP - Facilitator Support Program",
  showText = true,
  showBrandText = true,
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { icon: 28, text: "text-xs", gap: "gap-1.5" },
    md: { icon: 36, text: "text-sm", gap: "gap-2" },
    lg: { icon: 44, text: "text-base", gap: "gap-2.5" },
    xl: { icon: 56, text: "text-lg", gap: "gap-3" },
  };

  const config = sizeConfig[size];

  const brandText = (
    <div className="flex flex-col items-start leading-tight">
      <span className={`font-black tracking-tight text-[var(--foreground)] ${config.text}`}>
        FSP
      </span>
      {showText && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Facilitator Support
        </span>
      )}
    </div>
  );

  const logoImage = (
    <Image
      src="/fsp-logo.png"
      alt={alt}
      width={config.icon}
      height={config.icon}
      className="object-contain"
      priority
      unoptimized
    />
  );

  switch (variant) {
    case "icon":
      return (
        <div className={`flex items-center justify-center ${className}`}>
          {logoImage}
        </div>
      );

    case "text":
      return (
        <div className={`flex items-center ${config.gap} ${className}`}>
          {brandText}
        </div>
      );

    case "compact":
      return (
        <div className={`flex items-center ${config.gap} ${className}`}>
          <div className="w-8 h-8 rounded-xl bg-[var(--brand-navy)] flex items-center justify-center overflow-hidden">
            {logoImage}
          </div>
          {showBrandText && (
            <span className="font-black text-[var(--foreground)] text-sm">
              FSP
            </span>
          )}
        </div>
      );

    case "full":
    default:
      return (
        <div className={`flex items-center ${config.gap} ${className}`}>
          <div className="relative overflow-hidden rounded-xl bg-[var(--brand-navy)] shadow-md shadow-[var(--brand-navy)]/20">
            {logoImage}
          </div>
          {brandText}
        </div>
      );
  }
};

export default Logo;