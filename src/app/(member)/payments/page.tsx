"use client";
import React, { useState } from "react";
import { CoursesView } from "@/components/pages/CoursesView";
import { PaymentsView } from "@/components/pages/PaymentsView";

export default function Page() {
  const [renewalsOpen, setRenewalsOpen] = useState(false);
  return <div className="space-y-8"><CoursesView initialView="enrollments" /><details onToggle={event => setRenewalsOpen(event.currentTarget.open)} className="rounded-xl border border-[var(--card-border)] p-4"><summary className="cursor-pointer font-semibold">Membership renewal payments</summary>{renewalsOpen && <div className="mt-5"><PaymentsView /></div>}</details></div>;
}
