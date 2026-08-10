"use client";
import React from "react";
import { TasksView } from "@/components/pages/TasksView";

export default function Page() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TasksView />
    </div>
  );
}
