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
        <tr>
          {columns?.map((col, i) => (
            <th key={i} className="border-b p-2 font-semibold">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((row, i) => (
          <tr key={i} className="border-b">
            {columns?.map((col, j) => (
              <td key={j} className="p-2">
                {col.render ? col.render(row) : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
