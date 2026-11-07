import React from 'react';

export interface Column<T> {
  header: string;
  accessor: string;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> extends React.TableHTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
}

export function Table<T>({ columns, data, ...props }: TableProps<T>) {
  return (
    <table className="w-full text-left border-collapse" {...props}>
      <thead>
        <tr className="border-b border-[var(--card-border)] bg-[var(--muted-light)]/50">
          {columns?.map((col, i) => (
            <th key={i} className="border-b border-[var(--card-border)] p-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((row, i) => (
          <tr key={i} className="border-b border-[var(--card-border)]/50 hover:bg-[var(--muted-light)]/30 transition-colors">
            {columns?.map((col, j) => (
              <td key={j} className="p-3 text-sm text-[var(--foreground)]">
                {col.render ? col.render(row) : String(row[col.accessor as keyof T] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
