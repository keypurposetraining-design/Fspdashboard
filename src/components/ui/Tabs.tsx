import React from 'react';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
}
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const Tabs = ({ children, defaultValue, ...props }: TabsProps) => <div {...props}>{children}</div>;
export const TabsList = ({ children, ...props }: TabsListProps) => <div className="flex border-b" {...props}>{children}</div>;
export const TabsTrigger = ({ children, value, ...props }: TabsTriggerProps) => <button className="p-2 border-b-2 border-transparent hover:border-gray-300" {...props}>{children}</button>;
export const TabsContent = ({ children, value, ...props }: TabsContentProps) => <div className="p-4" {...props}>{children}</div>;
