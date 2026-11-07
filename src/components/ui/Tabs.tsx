import React from 'react';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
}
export type TabsListProps = React.HTMLAttributes<HTMLDivElement>;
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const Tabs = ({ children, defaultValue, ...props }: TabsProps) => <div data-default-value={defaultValue} {...props}>{children}</div>;
export const TabsList = ({ children, ...props }: TabsListProps) => <div className="flex border-b border-[var(--card-border)]" {...props}>{children}</div>;
export const TabsTrigger = ({ children, value, ...props }: TabsTriggerProps) => <button data-value={value} className="px-4 py-2 border-b-2 border-transparent hover:border-[var(--muted)] text-[var(--muted)] hover:text-[var(--foreground)] font-medium transition-colors" {...props}>{children}</button>;
export const TabsContent = ({ children, value, ...props }: TabsContentProps) => <div data-value={value} className="p-4" {...props}>{children}</div>;
