// Single source of truth for how statuses look across the app.
// Tone maps to the semantic tokens in globals.css; every status also has a
// text label and an icon so colour is never the only signal.

import type {
  ApplicationStatus,
  DocumentStatus,
  EffectiveMembershipStatus,
  DocumentType,
} from "@/lib/data/types";

export type Tone = "success" | "warning" | "danger" | "neutral" | "info";
export type StatusIcon = "check" | "clock" | "alert" | "x" | "dot" | "pause" | "edit";

export interface StatusMeta {
  label: string;
  tone: Tone;
  icon: StatusIcon;
  description: string;
}

export const MEMBERSHIP_STATUS: Record<EffectiveMembershipStatus, StatusMeta> = {
  active: { label: "Active", tone: "success", icon: "check", description: "Your membership is active." },
  pending: { label: "Pending approval", tone: "warning", icon: "clock", description: "Your membership becomes active once your application is approved." },
  expired: { label: "Expired", tone: "danger", icon: "alert", description: "Your membership has expired." },
  cancelled: { label: "Cancelled", tone: "neutral", icon: "x", description: "This membership was cancelled." },
  suspended: { label: "Suspended", tone: "danger", icon: "pause", description: "This membership is suspended. Contact the FSP team." },
  none: { label: "Not a member yet", tone: "neutral", icon: "dot", description: "Submit a membership application to get started." },
};

export const APPLICATION_STATUS: Record<ApplicationStatus | "none", StatusMeta> = {
  none: { label: "Not started", tone: "neutral", icon: "dot", description: "You haven't started a membership application." },
  draft: { label: "Draft", tone: "neutral", icon: "edit", description: "Your application is saved as a draft and hasn't been submitted." },
  submitted: { label: "Submitted", tone: "info", icon: "clock", description: "Your application was submitted and is waiting for review." },
  under_review: { label: "Under review", tone: "warning", icon: "clock", description: "An administrator is reviewing your application." },
  changes_requested: { label: "Changes requested", tone: "warning", icon: "alert", description: "An administrator asked for changes. Update your application and resubmit." },
  approved: { label: "Approved", tone: "success", icon: "check", description: "Your application was approved." },
  rejected: { label: "Rejected", tone: "danger", icon: "x", description: "Your application was not approved." },
};

export const DOCUMENT_STATUS: Record<DocumentStatus, StatusMeta> = {
  pending: { label: "Pending review", tone: "warning", icon: "clock", description: "Waiting for an administrator to review." },
  approved: { label: "Approved", tone: "success", icon: "check", description: "This document was approved." },
  rejected: { label: "Rejected", tone: "danger", icon: "alert", description: "This document was rejected. Upload a replacement." },
};

export const DOCUMENT_TYPES: Record<DocumentType, { label: string; required: boolean; hint: string }> = {
  identity_proof: { label: "Identity proof", required: true, hint: "Aadhaar, PAN, passport or driving licence" },
  address_proof: { label: "Address proof", required: true, hint: "Utility bill, bank statement or rental agreement" },
  photograph: { label: "Photograph", required: true, hint: "Recent passport-size photo" },
  qualification: { label: "Qualification certificate", required: false, hint: "Highest relevant qualification" },
  other: { label: "Other", required: false, hint: "Any supporting document" },
};

export const REQUIRED_DOCUMENT_TYPES = (Object.keys(DOCUMENT_TYPES) as DocumentType[]).filter(
  (t) => DOCUMENT_TYPES[t].required
);

export const ROLE_LABEL: Record<string, string> = {
  member: "Member",
  trainer: "Trainer",
  admin: "Admin",
  super_admin: "Super Admin",
};

/** 'active' with an end date in the past reads as 'expired'. */
export function effectiveMembershipStatus(
  status: string | null | undefined,
  endDate: string | null | undefined
): EffectiveMembershipStatus {
  if (!status) return "none";
  if (status === "active" && endDate && new Date(endDate) < startOfToday()) return "expired";
  return status as EffectiveMembershipStatus;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
