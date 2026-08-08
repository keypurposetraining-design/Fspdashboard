import React from 'react';

export const Tabs = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const TabsList = ({ children, ...props }: any) => <div className="flex border-b" {...props}>{children}</div>;
export const TabsTrigger = ({ children, ...props }: any) => <button className="p-2 border-b-2 border-transparent hover:border-gray-300" {...props}>{children}</button>;
export const TabsContent = ({ children, ...props }: any) => <div className="p-4" {...props}>{children}</div>;
