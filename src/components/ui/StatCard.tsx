import React from "react";
import { Card } from "./Card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode; // made optional
  trend?: {
    value: string;
    isUpward: boolean;
  };
  color?: "navy" | "gold" | "green" | "purple" | "teal" | "red" | "amber" | "gray";
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "navy",
  badge,
}) => {
  const iconBgStyles = {
    navy: "bg-[var(--brand-navy-light)] text-[var(--brand-navy)] border border-[var(--brand-navy)]/20",
    gold: "bg-[var(--brand-gold-light)] text-[var(--brand-gold-ink)] border border-[var(--brand-gold)]/20",
    green: "bg-[var(--success-light)] text-[var(--success)] border border-[var(--success-border)]/60",
    purple: "bg-[var(--info-light)] text-[var(--info)] border border-[var(--info-border)]/60",
    teal: "bg-[var(--success-light)] text-[var(--success)] border border-[var(--success-border)]/60",
    red: "bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]/60",
    amber: "bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning-border)]/60",
    gray: "bg-[var(--muted-light)] text-[var(--muted)] border border-[var(--muted-border)]",
  };

  return (
    <Card hoverEffect className="relative overflow-hidden">
      {/* FSP accent rule — the yellow bar that marks the site's key panels */}
      <span className="absolute inset-x-0 top-0 h-[3px] bg-[var(--brand-yellow)]" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--muted)] mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className={clsx(
              "p-3 rounded-2xl shrink-0 transition-transform duration-300 hover:scale-105",
              iconBgStyles[color]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(trend || badge) && (
        <div className="mt-4 pt-3 border-t border-[var(--card-border)] flex items-center justify-between text-xs">
          {trend && (
            <span
              className={clsx(
                "inline-flex items-center font-medium gap-1",
                trend.isUpward ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {trend.isUpward ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {badge && (
            <span className="font-medium text-[var(--muted)] bg-[var(--muted-light)] px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
