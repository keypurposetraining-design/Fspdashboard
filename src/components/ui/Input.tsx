// src/components/ui/Input.tsx
import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, id, ...props }, ref) => {
    const inputEl = (
      <input
        id={id}
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    );

    if (label) {
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
          {inputEl}
        </div>
      );
    }

    return inputEl;
  }
);
Input.displayName = "Input";
