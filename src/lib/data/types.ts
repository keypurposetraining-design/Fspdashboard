// Domain types for the member-management workflow.
// Column names mirror database/migrations/004_member_workflow.sql.

export type AppRole = "member" | "trainer" | "admin" | "super_admin";

export type MembershipStatus = "active" | "pending" | "expired" | "cancelled" | "suspended";
/** Effective status shown in the UI: 'active' past end_date reads 'expired'; no record is 'none'. */
export type EffectiveMembershipStatus = MembershipStatus | "none";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export type DocumentStatus = "pending" | "approved" | "rejected";

export type DocumentType =
  | "identity_proof"
  | "address_proof"
  | "photograph"
  | "qualification"
  | "other";

export interface MemberProfile {
  id: string;
  user_id: string;
  member_number: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  occupation: string | null;
  organization: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Fields a member may edit about themselves. Everything else is protected. */
export type EditableProfileFields = Pick<
  MemberProfile,
  | "first_name"
  | "last_name"
  | "phone"
  | "address"
  | "city"
  | "state"
  | "postal_code"
  | "country"
  | "occupation"
  | "organization"
  | "avatar_url"
>;

export interface Membership {
  id: string;
  member_id: string;
  start_date: string;
  end_date: string | null;
  status: MembershipStatus;
  membership_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembershipApplication {
  id: string;
  member_id: string;
  status: ApplicationStatus;
  membership_type: string;
  motivation: string | null;
  experience: string | null;
  referral_source: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  decision_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberDocument {
  id: string;
  member_id: string;
  application_id: string | null;
  document_type: DocumentType;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: DocumentStatus;
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  replaces_document_id: string | null;
}

export type NotificationCategory = "membership" | "application" | "documents" | "system";

export interface AppNotification {
  id: string;
  user_id: string;
  type: "info" | "warning" | "alert" | "message";
  payload: {
    title?: string;
    message?: string;
    category?: NotificationCategory;
    link?: string;
  } | null;
  read_at: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  performed_by: string | null;
  performed_at: string;
  details: Record<string, unknown> | null;
  users?: { name: string | null; email: string } | null;
}

export interface AppUserRow {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

/** Row shape returned by the admin_search_members RPC. */
export interface AdminMemberRow {
  member_id: string;
  member_number: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string;
  role: AppRole;
  is_active: boolean;
  avatar_url: string | null;
  membership_status: EffectiveMembershipStatus;
  membership_end_date: string | null;
  application_status: ApplicationStatus | "none";
  application_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardStats {
  total_members: number;
  membership: Partial<Record<EffectiveMembershipStatus, number>>;
  members_without_membership: number;
  applications: Partial<Record<ApplicationStatus, number>>;
  documents: Partial<Record<DocumentStatus, number>>;
  expiring_30_days: number;
}

export interface MonthlySeriesRow {
  month: string;
  new_members: number;
  applications_submitted: number;
  applications_approved: number;
  applications_rejected: number;
  documents_uploaded: number;
}
