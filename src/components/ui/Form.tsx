"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

const controlClass =
  "block w-full rounded-lg border bg-white px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)] disabled:bg-[var(--muted-light)] disabled:text-[var(--muted)]";

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
  className?: string;
}

/** Label + control + hint/error, wired up with aria-describedby / aria-invalid. */
export function Field({ label, error, hint, required, children, className }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, required, className, ...props }: TextFieldProps) {
  const Control = props.type === "password" ? Input : "input";
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <Control
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          required={required}
          className={cn(controlClass, invalid ? "border-red-400" : "border-[var(--card-border)]")}
          {...props}
        />
      )}
    </Field>
  );
}

type TextAreaFieldProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextAreaField({ label, error, hint, required, className, ...props }: TextAreaFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          required={required}
          className={cn(controlClass, "min-h-[110px]", invalid ? "border-red-400" : "border-[var(--card-border)]")}
          {...props}
        />
      )}
    </Field>
  );
}

type SelectFieldProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function SelectField({ label, error, hint, required, className, children, ...props }: SelectFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          required={required}
          className={cn(controlClass, invalid ? "border-red-400" : "border-[var(--card-border)]")}
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  );
}

/** Compact filter select for toolbars (label is visually hidden). */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-[var(--card-border)] bg-white px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)] sm:w-auto"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Search box for toolbars. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const id = useId();
  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[var(--card-border)] bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
      />
    </div>
  );
}
