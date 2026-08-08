// src/app/admin/layout.tsx
import Sidebar from "@/app/admin/Sidebar";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <section className="flex-1 overflow-y-auto p-6">
        {children}
      </section>
    </main>
  );
}
