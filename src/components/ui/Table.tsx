import React from 'react';

export interface Column {
  header: string;
  accessor: string;
  render?: (row: any) => React.ReactNode;
}

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  columns: Column[];
  data: any[];
}

export const Table = ({ columns, data, ...props }: TableProps) => {
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
                {col.render ? col.render(row) : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
