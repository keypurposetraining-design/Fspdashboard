"use client";
import React from "react";
import { DashboardView } from "@/components/pages/DashboardView";

export default function Page() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DashboardView onNavigate={() => {}} />
    </div>
  );
}
