// API row shapes used by the older content-management screens.
// Timestamps arrive as ISO strings; embedded to-one relations may be null.
export interface PersonRow { id: string; first_name?: string | null; last_name?: string | null; users?: { email: string } | null }
export interface UserRow { id: string; name?: string | null; email?: string; role?: string }
export interface CourseRow { id: string; title: string; description?: string | null; created_at: string; course_enrollments?: { id: string }[] }
export interface EventRow { id: string; title: string; description?: string | null; start_time: string; end_time?: string | null; location?: string | null; image_url?: string | null; fee?: number; event_registrations?: { id: string }[] }
export interface RegistrationRow { id: string; event_id: string; status: string; registered_at: string; members?: PersonRow | null }
export interface PaymentRow { id: string; amount: number; currency: string; status: string; payment_date: string; membership_id?: string | null; event_id?: string | null; events?: { title: string } | null; members?: PersonRow | null }
export interface CertificateRow { id: string; issued_at: string; certificate_url: string; members?: PersonRow | null; courses?: { title: string } | null }
export interface PostRow { id: string; content: string; created_at: string; parent_post_id?: string | null; user_id?: string; users?: { name: string | null; email?: string; role: string | null } | null }
export interface ResourceRow { id: string; title: string; url: string; description?: string | null; type: string; course_id?: string; courses?: { title: string } | null }
export interface TaskRow { id: string; title: string; description?: string | null; course_id?: string | null; due_date?: string | null; courses?: { title: string } | null }
export interface SubmissionRow { id: string; task_id: string; grade: number | null; file_url: string | null; submitted_at: string; tasks?: { title: string } | null; members?: PersonRow | null }
export interface NotificationRow { id: string; type: string; payload: { title?: string; message?: string } | null; created_at: string; users?: { email: string } | null }
export interface ActivityRow { id: string; action: string; ip_address: string | null; user_agent: string | null; metadata: Record<string, unknown>; created_at: string; members?: PersonRow | null }

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'An unexpected error occurred';
}
