"use client";

// src/components/ui/Input.tsx
import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, id, ...props }, ref) => {
    const [passwordVisible, setPasswordVisible] = React.useState(false);
    const isPassword = type === "password";
    const inputEl = (
      <input
        id={id}
        type={isPassword && passwordVisible ? "text" : type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-[var(--card-border)] bg-white px-3 py-2 text-sm",
          "placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] focus-visible:ring-offset-2",
          className,
          isPassword && "pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
        )}
        {...props}
      />
    );

    const field = isPassword ? (
      <div className="relative">
        {inputEl}
        <button
          type="button"
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          aria-pressed={passwordVisible}
          aria-controls={id}
          disabled={props.disabled}
          onClick={() => setPasswordVisible(visible => !visible)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] disabled:opacity-50"
        >
          {passwordVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    ) : inputEl;

    if (label) {
      return (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
          {field}
        </div>
      );
    }

    return field;
  }
);
Input.displayName = "Input";
