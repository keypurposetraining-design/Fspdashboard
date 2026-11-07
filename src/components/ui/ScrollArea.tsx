import React from 'react';

export type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement>;

export const ScrollArea = ({ children, ...props }: ScrollAreaProps) => {
  return (
    <div className="overflow-auto" {...props}>
      {children}
    </div>
  );
};
