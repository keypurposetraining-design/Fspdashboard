import React from 'react';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = (props: SelectProps) => {
  return (
    <select className="flex h-10 w-full rounded-md border border-[var(--card-border)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] focus-visible:ring-offset-2" {...props}>
      {props.children}
    </select>
  );
};
