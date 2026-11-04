import React from "react";
import { Button } from "./Button";
import { Sparkles } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-[var(--card-border)] rounded-3xl bg-[var(--muted-light)]/50">
      <div className="w-14 h-14 rounded-2xl bg-[var(--brand-navy-light)] text-[var(--brand-navy)] flex items-center justify-center mb-4 shadow-xs">
        {icon || <Sparkles className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--muted)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
