import React from 'react';

export const Select = (props: any) => {
  return (
    <select className="border rounded p-2" {...props}>
      {props.children}
    </select>
  );
};
