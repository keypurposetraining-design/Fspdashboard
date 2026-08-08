import React from 'react';

export const ScrollArea = ({ children, ...props }: any) => {
  return (
    <div className="overflow-auto" {...props}>
      {children}
    </div>
  );
};
