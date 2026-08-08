import React from 'react';

export const Table = ({ columns, data, ...props }: any) => {
  return (
    <table className="w-full text-left border-collapse" {...props}>
      <thead>
        <tr>
          {columns?.map((col: any, i: number) => (
            <th key={i} className="border-b p-2 font-semibold">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((row: any, i: number) => (
          <tr key={i} className="border-b">
            {columns?.map((col: any, j: number) => (
              <td key={j} className="p-2">
                {row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
