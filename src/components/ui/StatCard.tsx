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
  color?: "blue" | "orange" | "green" | "purple";
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "blue",
  badge,
}) => {
  const iconBgStyles = {
    blue: "bg-blue-50 text-[#0F4CFF] border border-blue-100",
    orange: "bg-orange-50 text-[#FF7A00] border border-orange-100",
    green: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border border-purple-100",
  };

  return (
    <Card hoverEffect className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
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
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
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
            <span className="font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
