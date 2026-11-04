"use client";

import React, { useState } from "react";
import { PaymentsSection } from "@/components/admin/PaymentsSection";
import { EnrollmentManagement } from "@/components/admin/EnrollmentManagement";

export default function AdminPaymentsPage() {
  const [renewalsOpen, setRenewalsOpen] = useState(false);
  return <div className="space-y-8"><EnrollmentManagement paymentsOnly /><details onToggle={event => setRenewalsOpen(event.currentTarget.open)} className="rounded-xl border border-[var(--card-border)] p-4"><summary className="cursor-pointer font-semibold">Membership renewal payments</summary>{renewalsOpen && <div className="mt-5"><PaymentsSection /></div>}</details></div>;
}
