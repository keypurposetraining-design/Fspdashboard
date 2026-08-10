import React from 'react';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = (props: SwitchProps) => {
  return <input type="checkbox" className="toggle" {...props} />;
};
