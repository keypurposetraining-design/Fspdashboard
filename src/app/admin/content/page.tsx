"use client";

import React, { useState } from "react";
import { clsx } from "clsx";
import { EventsSection } from "@/components/admin/EventsSection";
import { TasksSection } from "@/components/admin/TasksSection";
import { EnrollmentManagement } from "@/components/admin/EnrollmentManagement";
import { ResourcesSection } from "@/components/admin/ResourcesSection";
import { PaymentsSection } from "@/components/admin/PaymentsSection";
import { FeesSection } from "@/components/admin/FeesSection";
import { Calendar, Flag, BookOpen, Upload, CreditCard, IndianRupee } from "lucide-react";

const sections = [
  { id: "events", label: "Events & Fees", icon: Calendar },
  { id: "tasks", label: "Tasks & Challenges", icon: Flag },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "resources", label: "Resources", icon: Upload },
  { id: "fees", label: "Fees & Pricing", icon: IndianRupee },
  { id: "payments", label: "Payments", icon: CreditCard },
];

export default function ContentHubPage() {
  const [activeSection, setActiveSection] = useState("events");

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="fsp-dot text-2xl font-black text-slate-900 tracking-tight">Content Hub</h1>
        <p className="text-sm text-slate-500 font-medium">
          Manage everything members see — events (with fees), tasks, courses, resources, and pricing.
        </p>
      </div>

      {/* SECTION NAV */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={clsx(
                "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2",
                isActive
                  ? "text-[var(--brand-navy)] border-[var(--brand-navy)] bg-[var(--brand-navy-light)]"
                  : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <Icon className="w-4 h-4" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* ACTIVE SECTION */}
      <div className="animate-in fade-in duration-150">
        {activeSection === "events" && <EventsSection />}
        {activeSection === "tasks" && <TasksSection />}
        {activeSection === "courses" && <EnrollmentManagement />}
        {activeSection === "resources" && <ResourcesSection />}
        {activeSection === "fees" && <FeesSection />}
        {activeSection === "payments" && <PaymentsSection />}
      </div>
    </div>
  );
}
