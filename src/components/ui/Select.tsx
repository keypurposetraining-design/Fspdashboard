import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = (props: SelectProps) => {
  return (
    <select className="border rounded p-2" {...props}>
      {props.children}
    </select>
  );
};
