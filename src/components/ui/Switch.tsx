import React from 'react';

export type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Switch = (props: SwitchProps) => {
  return <input type="checkbox" className="toggle" {...props} />;
};
