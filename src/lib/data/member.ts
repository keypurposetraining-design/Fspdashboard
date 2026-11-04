// Member-facing data access. Every call runs as the signed-in user through
// RLS; nothing here can read or change another member's data. Status changes
// go through the SECURITY DEFINER RPCs in 005_workflow_rpcs.sql.

import { createClient } from "@/lib/supabase/client";
import { DataError, toDataError, unwrap } from "@/lib/data/errors";
import { validateProfile } from "@/lib/profile";
import type {
  AppNotification,
  DocumentType,
  EditableProfileFields,
  MemberDocument,
  MemberProfile,
  Membership,
  MembershipApplication,
} from "@/lib/data/types";

const supabase = () => createClient();

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase().auth.getUser();
  if (error || !data.user) throw new DataError("permission", "Your session has expired. Please sign in again.");
  return data.user.id;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** The signed-in user's member record (oldest row if duplicates still exist). */
export async function getMyProfile(): Promise<MemberProfile | null> {
  const uid = await currentUserId();
  const res = await supabase()
    .from("members")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return unwrap(res, "getMyProfile") as MemberProfile | null;
}

export async function updateMyProfile(
  input: Partial<Record<keyof EditableProfileFields, string | null>>
): Promise<MemberProfile> {
  const { values, errors } = validateProfile(input);
  if (Object.keys(errors).length > 0) {
    throw new DataError("validation", Object.values(errors)[0] ?? "Please check the form.");
  }
  const profile = await getMyProfile();
  if (!profile) throw new DataError("not_found", "Your member profile hasn't been created yet.");

  const res = await supabase()
    .from("members")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", profile.id)
    .select("*")
    .single();
  const updated = unwrap(res, "updateMyProfile") as MemberProfile;

  // Keep the display name on public.users in step with the member name.
  if ("first_name" in values || "last_name" in values) {
    const name = [updated.first_name, updated.last_name].filter(Boolean).join(" ");
    const nameResult = await supabase().from("users").update({ name }).eq("id", updated.user_id).select("id").single();
    unwrap(nameResult, "updateMyProfile.displayName");
  }
  return updated;
}

/** Uploads a profile photo to the public avatars bucket (own folder only) and returns its URL. */
export async function uploadAvatar(file: File): Promise<string> {
  const uid = await currentUserId();
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new DataError("validation", "Use a JPG, PNG or WebP image.");
  }
  if (file.size > 2 * 1024 * 1024) throw new DataError("validation", "The photo must be 2 MB or smaller.");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${uid}/avatar-${Date.now()}.${ext}`;
  const up = await supabase().storage.from("avatars").upload(path, file, { upsert: false, contentType: file.type });
  if (up.error) throw toDataError(up.error, "uploadAvatar");
  return supabase().storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

export async function getMyMemberships(memberId: string): Promise<Membership[]> {
  const res = await supabase()
    .from("memberships")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "getMyMemberships") ?? []) as Membership[];
}

export async function getRenewalFee(): Promise<{ amount: number; currency: string } | null> {
  const res = await supabase().from("app_settings").select("value").eq("key", "renewal_fee").maybeSingle();
  if (res.error) return null;
  const v = res.data?.value as { amount?: number; currency?: string } | undefined;
  return v?.amount ? { amount: v.amount, currency: v.currency ?? "INR" } : null;
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export async function getMyApplications(memberId: string): Promise<MembershipApplication[]> {
  const res = await supabase()
    .from("membership_applications")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  return (unwrap(res, "getMyApplications") ?? []) as MembershipApplication[];
}

/** RLS returns nothing for another member's application, so this is safe to call with any id. */
export async function getApplication(id: string): Promise<MembershipApplication | null> {
  const res = await supabase().from("membership_applications").select("*").eq("id", id).maybeSingle();
  return unwrap(res, "getApplication") as MembershipApplication | null;
}

export async function createDraftApplication(memberId: string): Promise<MembershipApplication> {
  const res = await supabase()
    .from("membership_applications")
    .insert({ member_id: memberId })
    .select("*")
    .single();
  return unwrap(res, "createDraftApplication") as MembershipApplication;
}

export interface ApplicationInput {
  motivation: string;
  experience: string;
  referral_source: string;
}

export function validateApplication(input: ApplicationInput): Partial<Record<keyof ApplicationInput, string>> {
  const errors: Partial<Record<keyof ApplicationInput, string>> = {};
  if (input.motivation.trim().length < 20) errors.motivation = "Tell us a little more (at least 20 characters).";
  if (input.motivation.length > 4000) errors.motivation = "Keep this under 4,000 characters.";
  if (input.experience.length > 4000) errors.experience = "Keep this under 4,000 characters.";
  if (input.referral_source.length > 200) errors.referral_source = "Keep this under 200 characters.";
  return errors;
}

export async function saveApplication(id: string, input: ApplicationInput): Promise<MembershipApplication> {
  const errors = validateApplication(input);
  if (Object.keys(errors).length) throw new DataError("validation", Object.values(errors)[0]!);
  const res = await supabase()
    .from("membership_applications")
    .update({
      motivation: input.motivation.trim(),
      experience: input.experience.trim() || null,
      referral_source: input.referral_source.trim() || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  return unwrap(res, "saveApplication") as MembershipApplication;
}

export async function submitApplication(id: string): Promise<void> {
  const res = await supabase().rpc("submit_application", { p_application_id: id });
  unwrap(res, "submitApplication");
}

// ---------------------------------------------------------------------------
// Documents (private bucket, signed URLs only)
// ---------------------------------------------------------------------------

const DOC_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export async function getMyDocuments(memberId: string): Promise<MemberDocument[]> {
  const res = await supabase()
    .from("member_documents")
    .select("*")
    .eq("member_id", memberId)
    .order("uploaded_at", { ascending: false });
  return (unwrap(res, "getMyDocuments") ?? []) as MemberDocument[];
}

export async function uploadDocument(opts: {
  memberId: string;
  documentType: DocumentType;
  file: File;
  applicationId?: string | null;
  replacesDocumentId?: string | null;
}): Promise<MemberDocument> {
  const { file } = opts;
  if (!DOC_MIME.includes(file.type)) throw new DataError("validation", "Upload a PDF, JPG, PNG or WebP file.");
  if (file.size > MAX_DOCUMENT_BYTES) throw new DataError("validation", "Files must be 10 MB or smaller.");

  const uid = await currentUserId();
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-120);
  const path = `${uid}/${opts.documentType}/${Date.now()}-${safeName}`;

  const up = await supabase().storage.from("member-documents").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (up.error) throw toDataError(up.error, "uploadDocument.storage");

  const res = await supabase()
    .from("member_documents")
    .insert({
      member_id: opts.memberId,
      application_id: opts.applicationId ?? null,
      document_type: opts.documentType,
      file_name: file.name.slice(0, 255),
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
      replaces_document_id: opts.replacesDocumentId ?? null,
    })
    .select("*")
    .single();
  return unwrap(res, "uploadDocument.insert") as MemberDocument;
}

/** Short-lived signed URL; storage RLS allows only the owner or an admin. */
export async function getDocumentUrl(storagePath: string): Promise<string> {
  const res = await supabase().storage.from("member-documents").createSignedUrl(storagePath, 60);
  if (res.error || !res.data) throw toDataError(res.error, "getDocumentUrl");
  return res.data.signedUrl;
}

/** Latest document per type (older versions are kept as history). */
export function latestByType(docs: MemberDocument[]): Map<DocumentType, MemberDocument> {
  const map = new Map<DocumentType, MemberDocument>();
  for (const d of docs) {
    const cur = map.get(d.document_type);
    if (!cur || new Date(d.uploaded_at) > new Date(cur.uploaded_at)) map.set(d.document_type, d);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getMyNotifications(limit = 100): Promise<AppNotification[]> {
  const uid = await currentUserId();
  const res = await supabase()
    .from("notifications")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (unwrap(res, "getMyNotifications") ?? []) as AppNotification[];
}

export async function getUnreadCount(userId?: string): Promise<number> {
  // Shell already has the current user. RLS still enforces row ownership.
  const uid = userId ?? await currentUserId();
  const res = await supabase()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .is("read_at", null);
  if (res.error) throw toDataError(res.error, "getUnreadCount");
  return res.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await supabase().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  unwrap(res, "markNotificationRead");
}

export async function markAllNotificationsRead(): Promise<void> {
  const uid = await currentUserId();
  const res = await supabase()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", uid)
    .is("read_at", null);
  unwrap(res, "markAllNotificationsRead");
}

// ---------------------------------------------------------------------------
// Activity (own audit trail: profile/application/document events)
// ---------------------------------------------------------------------------

export interface ActivityItem {
  id: string;
  action: string;
  at: string;
}

/** Recent own activity from member_activity_logs (RLS: own rows only). */
export async function getMyRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const uid = await currentUserId();
  const res = await supabase()
    .from("member_activity_logs")
    .select("id, action, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (res.error) throw toDataError(res.error, "getMyRecentActivity");
  return (res.data ?? []).map((r) => ({ id: r.id, action: r.action, at: r.created_at }));
}
