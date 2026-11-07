// TypeScript interfaces matching the Supabase PostgreSQL schema

export interface User {
  id: string; // UUID
  email: string;
  password_hash: string;
  name?: string;
  role?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Member {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Membership {
  id: string;
  member_id: string;
  start_date: string; // ISO date
  end_date?: string;
  status: "active" | "pending" | "cancelled" | "expired";
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CourseEnrollment {
  id: string;
  member_id: string;
  course_id: string;
  enrollment_date: Date;
  status: "active" | "completed" | "dropped";
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Task {
  id: string;
  course_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  member_id: string;
  submitted_at: Date;
  grade?: number;
  file_url?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time?: Date;
  location?: string;
  fee?: number; // registration fee (0 = free)
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  member_id: string;
  status: "registered" | "waitlist" | "cancelled";
  registered_at: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Payment {
  id: string;
  member_id: string;
  membership_id?: string;
  event_id?: string; // set when the payment is for an event RSVP
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  payment_date: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Certificate {
  id: string;
  member_id: string;
  course_id: string;
  issued_at: Date;
  certificate_url: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Resource {
  id: string;
  course_id: string;
  title: string;
  url: string;
  type: "video" | "document" | "link";
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "info" | "warning" | "alert" | "message";
  payload?: Record<string, unknown>;
  read_at?: Date;
  created_at: Date;
  created_by?: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  parent_post_id?: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id?: string;
  performed_by?: string;
  performed_at: Date;
  details?: Record<string, unknown>;
}

export interface AppSetting {
  key: string;
  value: unknown; // JSONB
  updated_at: Date;
  updated_by?: string;
}
