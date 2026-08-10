# FSP Dashboard Production Route Map

This document outlines the final production routing structure, associated views, database tables queried/mutated, and authorization policies.

---

## Member Portal Routes

### `/` (Root)
- **Component**: Home Layout containing sidebar tabs
- **Authentication**: Yes (verified via client session and SSR middleware proxy check)
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `members` (loads profile details)

### `/dashboard`
- **Component**: [DashboardView](file:///D:/FSP%20Dashboad/FSP%20Dashboad/src/components/pages/DashboardView.tsx)
- **Authentication**: Yes
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `members`, `memberships`, `courses`, `course_enrollments`, `tasks`, `task_submissions`, `events`

### `/courses`
- **Component**: [CoursesView](file:///D:/FSP%20Dashboad/FSP%20Dashboad/src/components/pages/CoursesView.tsx)
- **Authentication**: Yes
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `courses`, `course_enrollments`, `members`

### `/tasks`
- **Component**: [TasksView](file:///D:/FSP%20Dashboad/FSP%20Dashboad/src/components/pages/TasksView.tsx)
- **Authentication**: Yes
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `tasks`, `task_submissions`, `members`

### `/events`
- **Component**: [EventsView](file:///D:/FSP%20Dashboad/FSP%20Dashboad/src/components/pages/EventsView.tsx)
- **Authentication**: Yes
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `events`, `event_registrations`, `members`

### `/payments`
- **Component**: [PaymentsView](file:///D:/FSP%20Dashboad/FSP%20Dashboad/src/components/pages/PaymentsView.tsx)
- **Authentication**: Yes
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `payments`, `memberships`, `members`

### `/certificates`
- **Component**: [CertificatesView](file:///D:/FSP%20Dashboad/FSP%20Dashboad/src/components/pages/CertificatesView.tsx)
- **Authentication**: Yes
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `certificates`, `courses`, `members`

### `/community`
- **Component**: [CommunityView](file:///D:/FSP%20Dashboad/FSP%20Dashboad/src/components/pages/CommunityView.tsx)
- **Authentication**: Yes
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `community_posts`, `users`

### `/notifications`
- **Component**: [NotificationsView](file:///D:/FSP%20Dashboad/FSP%20Dashboad/src/components/pages/NotificationsView.tsx)
- **Authentication**: Yes
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `notifications`

### `/profile`
- **Component**: [ProfileView](file:///D:/FSP%20Dashboad/FSP%20Dashboad/src/components/pages/ProfileView.tsx)
- **Authentication**: Yes
- **Role Requirement**: member, trainer, admin, or super_admin
- **Database Tables**: `members`, `users`

### `/login`
- **Component**: Login Page (client-side email/password authentication via Supabase)
- **Authentication**: No
- **Role Requirement**: None

---

## Administration Portal Routes

All routes starting with `/admin` are protected by `src/proxy.ts` middleware and check database-level role attributes.

### `/admin/dashboard`
- **Component**: Admin Dashboard View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `members`, `memberships`, `payments`, `task_submissions`, `audit_logs`

### `/admin/members`
- **Component**: Admin Members Listing View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `members`, `users`, `audit_logs`

### `/admin/memberships`
- **Component**: Admin Memberships Management View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `memberships`, `members`, `audit_logs`

### `/admin/courses`
- **Component**: Admin Courses Management View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `courses`, `audit_logs`

### `/admin/tasks`
- **Component**: Admin Tasks Evaluation View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `tasks`, `task_submissions`, `audit_logs`

### `/admin/events`
- **Component**: Admin Events Management View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `events`, `event_registrations`, `audit_logs`

### `/admin/payments`
- **Component**: Admin Payments Reconciliation View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `payments`, `members`, `memberships`, `audit_logs`

### `/admin/certificates`
- **Component**: Admin Certificate Issuance View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `certificates`, `members`, `courses`, `audit_logs`

### `/admin/resources`
- **Component**: Admin Resource Files Upload View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `resources`, `courses`, `audit_logs`

### `/admin/community`
- **Component**: Admin Discussions Moderation View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `community_posts`, `users`, `audit_logs`

### `/admin/notifications`
- **Component**: Admin Alerts Dispatcher View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `notifications`, `users`, `audit_logs`

### `/admin/audit-logs`
- **Component**: Admin System Audit Logs View
- **Authentication**: Yes
- **Role Requirement**: admin, super_admin
- **Database Tables**: `audit_logs`
