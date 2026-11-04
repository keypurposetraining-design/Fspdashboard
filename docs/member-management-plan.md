# FSP Member Management: Current State and Implementation Plan

**Prepared:** 2026-09-24
**Status (2026-09-24):**

- **Phase 1 code: done.** `tsc` passes, and lint went from 214 errors to 209 with none new.
- **SQL files written:** `000_diagnostics`, `001_security_hotfix`, `002_user_sync`. **None of them has been executed yet.** They need a database: the local Postgres or the Supabase SQL editor.
- **Not written yet:** 003_data_repair. It waits for the M0 diagnostics output.
- **Part 2 (multi-page dashboard): implemented.** `tsc` passes, `next build` passes (54 routes), and the proxy redirects were checked against a running server. **Still untested:** the pages as a signed-in user. The Supabase project URL in `.env.local` doesn't resolve, and migrations 004 and 005 haven't been applied.
**Inputs:** a full inspection of the repository, plus [database/20260909_fix_google_oauth_member_sync.ANALYSIS.md](../database/20260909_fix_google_oauth_member_sync.ANALYSIS.md).

> **Limitation:** I could only inspect the code and the SQL files. I can't reach the live Supabase database: `.env.local` holds only the anon key, and there is no service-role key or DB password. Anything this document says about *existing data* (duplicates, drift, free memberships) is a risk to check with the Phase 0 diagnostics, not a confirmed fact.

---

## 1. Current architecture

| Layer | What exists |
|---|---|
| Framework | Next.js 16.3 (App Router, `src/proxy.ts` = middleware), React 19, Tailwind 4, TypeScript strict |
| Backend | Supabase (Postgres + Auth + Storage). There are no server actions. There are 3 API routes: `api/auth/sync`, `api/admin/members`, `api/activity`. |
| Data access | **Every page is `"use client"`.** All reads and writes go from the browser with the anon key straight to PostgREST, so **RLS is the only real security boundary.** |
| Supabase clients | `lib/supabase.ts` (browser singleton), `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (cookie SSR), `lib/supabase/admin.ts` (service role, server only, used by 1 route) |
| Member UI | `app/{dashboard,membership,profile,payments,notifications,…}` are thin wrappers around `components/pages/*View.tsx` |
| Admin UI | `app/admin/*` has 18 pages plus `components/admin/*Section.tsx` |
| Design system | `components/ui/*`: Button, Card, Badge, Input, Select, Table, Tabs, StatCard, ProgressBar, EmptyState, Avatar, Switch, ScrollArea, Logo |
| Tests | **None.** There is no test runner. |
| Tooling | `tsc --noEmit` passes. `eslint src` reports **214 errors and 118 warnings that already exist** (mostly `no-explicit-any`). |
| Mock data still in production views | `MembershipView` (member list and tabs from `src/data/members.ts`), `CoursesView` (catalog), `DashboardView` (course/program counts), and `membership/register` (writes to **localStorage**, including a plaintext password) |

## 2. Current authentication flow

```
/login ─► AuthProvider.loginWithGoogle()
            signInWithOAuth({ provider:'google', redirectTo: <origin>/dashboard })
         ─► Google ─► Supabase ─► /dashboard?code=…  (browser client exchanges the PKCE code; there is no /auth/callback route)
         ─► DB trigger on_auth_user_created (AFTER INSERT OR UPDATE on auth.users) ─► handle_new_user()
                ├─ upsert public.users   (role = existing role, or raw_user_meta_data.role, or 'member')   ⚠
                ├─ upsert public.members
                └─ insert memberships status='active', no end_date                                  ⚠
         ─► AuthProvider.fetchUserProfile(): SELECT public.users by id
                └─ missing? rpc('sync_current_user')  (a third copy of the sync logic)
                └─ still missing? use user_metadata.role                                            ⚠
            membershipStatus falls back to 'active' on every error or missing row                   ⚠
```

- Email/password login also exists (`signInWithPassword`), and admins can create users through `POST /api/admin/members`.
- Route guard: `src/proxy.ts` matches **only `/admin/:path*`**. It reads the role from `public.users`, which is correct. **Member routes have no server-side guard.** `docs/route-map.md` says they do, but that is wrong.
- `/login/admin` passes the `?redirect=` value to `router.replace` without checking it, which is an open redirect.
- `forgotPassword` redirects to `/reset-password`, which does not exist.

## 3. Current database and schema summary

The source of truth is `database/supabase_migrations.sql` (one 870-line file) plus `database/20260909_fix_google_oauth_member_sync.sql`.

| Table | Key columns / notes |
|---|---|
| `users` | `id` (should equal `auth.users.id`), `email UNIQUE`, `name`, `role VARCHAR` (**no CHECK constraint**), `password_hash` (now nullable) |
| `members` | `user_id → users(id)` (unique constraint `members_user_id_unique` added by the migration), `first_name`, `last_name`, `address`, `phone`. **No** member number, city, state, postal code, occupation, organization or avatar. |
| `memberships` | `member_id`, `start_date`, `end_date`, `status membership_status` (`active, pending, cancelled, expired`) |
| `payments` | `member_id`, `membership_id`, `event_id`, `amount`, `status payment_status` |
| `notifications` | `user_id`, `type notification_type` (`info, warning, alert, message`), `payload jsonb`, `read_at` |
| `audit_logs` | `action`, `table_name`, `record_id`, `performed_by`, `details jsonb` |
| `member_activity_logs` | Login, logout and view activity, written through `/api/activity` |
| `app_settings` | key/value store (`renewal_fee` = ₹3000) |
| Others | courses, course_enrollments, tasks, task_submissions, events, event_registrations, certificates, resources, community_posts |
| Storage | bucket `task-submissions` (private, `{auth.uid}/…` folder policy) |

**Does not exist yet:** membership applications, member documents, a document bucket, application status, member number, super-admin-only helpers, an append-only audit guard.

**Every FK to `members(id)` and `users(id)` uses the default `NO ACTION`**, with no cascade on delete or update. That affects both deduplication and the id-drift repair.

**The migration file itself is broken:** lines 240, 251, 255 and 358 use `$` instead of `$$`. That is a syntax error, so the file cannot be run from top to bottom. It is also not re-runnable, because the base `CREATE TABLE` and `CREATE TYPE` statements lack `IF NOT EXISTS`. The live DB may therefore differ from the file, and Phase 0 needs to confirm what is actually there.

## 4. Existing role system

- Roles are stored in `public.users.role` as free text. The code uses `member`, `admin`, `super_admin`, and also `trainer` (`AuthProvider` type, login redirect to a `/trainer/dashboard` page that doesn't exist). `src/lib/types.ts` uses `super-admin` with a hyphen, but that file appears unused.
- `public.is_admin()` returns true for admin or super_admin. **There is no `is_super_admin()`**, so admins and super admins are identical everywhere.
- The frontend reads the role from AuthProvider, and it can come from `user_metadata`.

## 5. Existing RLS policies (summary)

| Table | Member | Admin | Problem |
|---|---|---|---|
| users | SELECT own; **UPDATE own (all columns)** | all | **A member can set their own `role`** |
| members | SELECT/UPDATE own | all | Update has no `WITH CHECK`, so a member can change `user_id` to point the row elsewhere |
| memberships | SELECT own | ALL | ok |
| payments | SELECT own; **INSERT own (any status)** | ALL | **A member can insert `status='succeeded'`**. `PaymentsSection` treats `succeeded` as a reason to activate the membership. |
| notifications | SELECT/UPDATE own (any column) | ALL | Minor: a member can edit a notification's payload |
| audit_logs | none | SELECT, INSERT | No UPDATE/DELETE policy, so it is effectively append-only. But audit rows are written by the browser after each action: not atomic, and `performed_by` is supplied by the client. |
| member_activity_logs | SELECT/INSERT own | all | **anon INSERT** allowed for `AUTH_LOGIN_FAILED` (spam vector); `action` is free text |
| app_settings | SELECT | ALL | Any admin can change any setting |
| storage `task-submissions` | own folder | read all | ok |

## 6. Problems found (ranked)

### 🔴 Critical: privilege escalation (fix first)

1. **A member can become super admin with one browser call:** `supabase.from('users').update({ role: 'super_admin' }).eq('id', myId)`. The `users` UPDATE policy has no column restriction.
2. **Signup metadata role.** `handle_new_user`, `sync_current_user` and the backfill all trust `raw_user_meta_data->>'role'`. A user who signs up with email and passes `{ data: { role: 'admin' } }` becomes an admin.
3. **Any admin can create a super_admin.** `POST /api/admin/members` passes `body.role` straight into `users.role` and `user_metadata.role`, with no whitelist.
4. **Members can forge a paid payment.** The payments INSERT policy allows `status='succeeded'`.
5. **An admin can promote themselves.** It is the same `users` UPDATE hole (admins can update all rows).

### 🟠 High: auth reliability and data integrity

6. **The trigger has no exception guard and fires on every `auth.users` UPDATE,** including every sign-in. Any sync error, such as the email clash below, blocks login for existing users too.
7. **Email/id drift.** The upsert handles `ON CONFLICT (id)` but not the unique `email`. A drifted row makes Google sign-in fail with "Database error saving new user". The existing repair block skips any user that has dependents.
8. **Duplicate-member cleanup deletes rows that other tables reference,** so it either aborts with an FK violation or orphans data. It also misses duplicates with the same `created_at`.
9. **Free lifetime `active` membership for every account.** This bypasses the ₹3000 renewal fee. `AuthProvider` also treats a missing or failed membership lookup as `'active'`.
10. **`POST /api/admin/members` is broken with the current trigger.** The trigger has already inserted the `users` and `members` rows, so the route's own inserts hit the primary key and it rolls back by deleting the auth user. It also needs `SUPABASE_SERVICE_ROLE_KEY`, which is not in `.env.local`.

### 🟡 Medium

11. **The sync logic is copied 3 times** (trigger, backfill, RPC) and the copies have drifted. The whole function is also duplicated between the two SQL files.
12. **Audit logging is done by the client and is not atomic.** Insert errors are ignored.
13. **No server guard on member routes.** `/test` is a debug page that queries `users` without a guard.
14. **Open redirect** in `/login/admin`.
15. **Client fallbacks trust `user_metadata.role`** (`AuthProvider.tsx:97`, `api/auth/sync/route.ts:34`).
16. **Mock data and localStorage registration in production views.** `CoursesView` inserts a mock program id as `event_id`.
17. **The admin members list loads every row into the browser**, with no server-side pagination.

## 7. Proposed migration plan

All new SQL goes into **new numbered files** under `database/migrations/`. The broken `supabase_migrations.sql` gets its `$` typos fixed, but otherwise stays as historical base schema. Every migration is idempotent. Destructive steps archive rows as jsonb into `public._migration_archive` before touching them, so nothing is silently deleted.

| # | File | What it does | Destructive? |
|---|---|---|---|
| M0 | `000_diagnostics.sql` | **Read-only.** You run it in the Supabase SQL editor and share the output. It counts: auth users without users/members rows, duplicate `members.user_id`, email/id drift, admin and super_admin accounts (with metadata role), memberships auto-created by the old trigger, invalid statuses, orphaned records. | No |
| M1 | `001_security_hotfix.sql` | Adds `is_super_admin()` and a `current_app_role()` helper. Adds a **BEFORE UPDATE trigger on `users`** that rejects changes to `role`, `id`, `email` or `is_active` unless they come from the `set_user_role` RPC or the service role. Adds a `CHECK (role IN ('member','admin','super_admin'[, 'trainer']))` on users. Adds a `WITH CHECK` to the members update policy and makes `user_id` immutable. Restricts member payment inserts to `status='pending'`. Revokes anon `EXECUTE` on the functions. | No |
| M2 | `002_user_sync.sql` | Adds a single function `_sync_user(auth.users)`: role is always `'member'` for new rows and the existing role is never changed; names come from the metadata only; **no membership row is created**. If the email already exists on another id, it records the case in `auth_sync_issues` instead of raising. Rewrites the trigger as `AFTER INSERT OR UPDATE OF email, raw_user_meta_data` with `EXCEPTION WHEN OTHERS → RAISE WARNING`, so it never blocks auth. `sync_current_user()` becomes a wrapper around `_sync_user`. | No |
| M3 | `003_data_repair.sql` | 1. Switches the FKs that point at `users(id)` to `ON UPDATE CASCADE`. 2. **Id drift:** re-keys the drifted `public.users.id` to the auth id; the cascade carries every dependent row along. 3. **Duplicate members:** keeps the oldest (ties broken by id), re-points every `member_id` FK to it (memberships, enrollments, submissions, registrations, payments, certificates, activity logs), and archives any conflicting child rows before removing them. 4. Adds the `members.user_id` unique constraint if it is missing. 5. **Free memberships:** runs the rule you choose (Question B). 6. Backfills `_sync_user` for every `auth.users` row. | **Yes. It needs your go-ahead after M0 results.** |
| M4 | `004_member_workflow.sql` | **members:** adds `member_number` (`FSP-000123`, from a sequence), `city`, `state`, `postal_code`, `occupation`, `organization`, `avatar_url`, `date_of_birth`. **users:** adds `is_active`. `ALTER TYPE membership_status ADD VALUE 'suspended'`. **New tables:** `membership_applications` (enum `application_status`: `draft, submitted, under_review, changes_requested, approved, rejected`) and `member_documents` (`document_type, storage_path, status, reviewed_by/at, rejection_reason`). **Storage:** a private `member-documents` bucket with `{auth.uid}/…` policies. **RLS** on every new table. | No (additive) |
| M5 | `005_workflow_rpcs.sql` | Adds `SECURITY DEFINER` RPCs that do the status change, membership update, notification and audit row **in one transaction**: `submit_application`, `review_application(id, decision, reason)` (blocks self-approval), `review_document`, `set_user_role` (super_admin only; can't demote the last super_admin; audited), `set_user_active`, `update_setting` (tiered by setting). | No |
| M6 | `006_audit_hardening.sql` | **audit_logs:** adds `actor_role`, `old_value`, `new_value`, `reason`, `entity`. Makes it append-only: revokes UPDATE/DELETE and adds a trigger that raises on UPDATE/DELETE. `performed_by` is always `auth.uid()`, set by a trigger rather than by the client. **Visibility:** super admins see every row; admins see everything except `ROLE_CHANGED` and `SETTINGS_CHANGED` rows. | No |

## 8. Proposed implementation plan (phases)

Each phase ends with `tsc --noEmit`, eslint on the touched files (without adding to the existing baseline), and the SQL/RLS test script (below).

| Phase | Scope | Main files |
|---|---|---|
| **0: Verification harness** | A local Postgres in Docker with a stub `auth` schema (`auth.uid()` driven by `request.jwt.claims`, plus `anon`/`authenticated` roles) so migrations and RLS can be **actually executed and tested** here. Includes `database/tests/rls_tests.sql`, which checks things like "member cannot update role" and "member cannot read another member". | `database/tests/*`, `scripts/db-test.*` |
| **1: Security hotfix** | M1 + M2. **Code:** remove every `user_metadata.role` fallback. **Admin members API:** whitelist the role (only super_admin may create an admin; nobody creates a super_admin through this API), stop setting a metadata role, and upsert instead of insert so it works with the trigger. **Login:** fix the open redirect. Delete `/test`. `membershipStatus` no longer defaults to `'active'`. | `AuthProvider.tsx`, `api/auth/sync/route.ts`, `api/admin/members/route.ts`, `login/admin/page.tsx`, `app/test/` |
| **2: Data repair** | M0 (you run it), then M3 once you approve it. | `database/migrations/003_*` |
| **3: Route and API protection** | **Proxy:** require login for member routes; `/admin/*` stays admin or super_admin; `/super-admin/*` is super_admin only; disabled users are blocked. Add a `/auth/callback` route handler. Add a shared server helper `requireRole()` that reads `public.users`. | `proxy.ts`, `app/auth/callback/route.ts`, `lib/auth/server.ts` |
| **4: Member experience** | M4, M5. **Dashboard:** member number, profile completion, membership, application and document status, next actions. **My Profile:** edits only the allowed fields, validated on the server. **My Application:** multi-step form, submit, status timeline. **My Documents:** upload, replace rejected ones, view via signed URLs. Replaces the mock data in MembershipView and the localStorage registration. | `components/pages/{DashboardView,ProfileView,MembershipView}.tsx`, new `ApplicationView`, `DocumentsView`, `membership/register` |
| **5: Admin experience** | **Summary cards** (server-side counts). **Member table** with server-side search, filter, sort and pagination (PostgREST `range` + `count`). **Review page:** profile, application, documents, history, approve / reject / request changes with a confirmation dialog and a required reason. **Audit:** the admin pages move from "insert into audit_logs from the browser" to RPCs and DB triggers. | `admin/dashboard`, `admin/members`, `admin/members/[memberId]`, new `admin/applications`, `components/admin/*` |
| **6: Super Admin** | `/super-admin`: admin management (promote or demote, disable), user management, membership and approval settings, system settings, full audit log, security view (the `auth_sync_issues` queue, recent role changes). | new `app/super-admin/*` |
| **7: Notifications and polish** | DB-side notifications from the review RPCs, admin notifications when an application or document is submitted, an expiry-approaching job (a SQL function you can schedule with `pg_cron` if enabled), loading, empty and error states. | `NotificationsView`, RPCs |

## 9. Files that will be modified

`src/components/auth/AuthProvider.tsx`, `src/app/api/auth/sync/route.ts`, `src/app/api/admin/members/route.ts`, `src/proxy.ts`, `src/app/login/admin/page.tsx`, `src/app/login/page.tsx`, `src/components/pages/{DashboardView,ProfileView,MembershipView,SettingsView,PaymentsView,NotificationsView}.tsx`, `src/app/membership/register/page.tsx`, `src/app/admin/{dashboard,members,members/[memberId],memberships,audit-logs,settings}/page.tsx`, `src/app/admin/Sidebar.tsx`, `src/components/admin/{PaymentsSection,FeesSection}.tsx`, `src/components/layout/Sidebar.tsx`, `database/supabase_migrations.sql` (`$` typo fix only), `database/20260909_fix_google_oauth_member_sync.sql` (marked superseded), `database/types.ts`, `docs/route-map.md`.

**Deleted:** `src/app/test/page.tsx` (unguarded debug page).

## 10. New files that will be created

- `database/migrations/000_diagnostics.sql` … `006_audit_hardening.sql`
- `database/tests/auth_stub.sql`, `database/tests/rls_tests.sql`, `database/tests/README.md`
- `src/lib/auth/server.ts` (`getSessionUser`, `requireRole`)
- `src/app/auth/callback/route.ts`
- `src/components/pages/{ApplicationView,DocumentsView}.tsx`, `src/app/{application,documents}/page.tsx`
- `src/app/admin/applications/page.tsx`, `src/app/admin/applications/[applicationId]/page.tsx`
- `src/app/super-admin/{layout,page}.tsx`, `src/app/super-admin/{admins,users,settings,audit-logs,security}/page.tsx`
- `src/components/ui/{ConfirmDialog,StatusBadge,Pagination}.tsx`, but only where the existing components don't already cover it

## Decisions (answered 2026-09-24)

- **A. Membership lifecycle: admin approval only.** When an admin approves an application, the membership is set to `active`. There is no payment step for activation. The existing payments and renewal flow stays as it is.
- **B. Existing free `active` memberships: reset to `pending`.** This covers memberships the old trigger created: `end_date IS NULL`, `created_by IS NULL`, and no succeeded payment. M3 archives these rows first and then sets them to `pending`. The M0 diagnostics show the exact count before anything runs.
- **C. `trainer` role: kept.** The role CHECK allows `member, trainer, admin, super_admin`. A trainer has member permissions until trainer features exist.
- **D. Route layout: keep the existing member URLs and add `/super-admin/*`.** This is the default, chosen because it doesn't break existing links.
- **E. Fee settings: admins keep fees.** `renewal_fee` and event fees stay admin-editable. Every other `app_settings` key is super-admin only. All changes are audited.

---

# Part 2: Multi-page dashboard (requested 2026-09-24)

## Frontend report

1. **Architecture.** Next.js 16 App Router. Every page is a client component that queries Supabase directly, so RLS is the security boundary. Part 1 already covers this.
2. **Routing.**
   - Member URLs such as `/dashboard`, `/profile`, `/membership` and `/courses` exist, but each is a bare wrapper around a `*View` component with **no layout**: no sidebar or header.
   - `/admin/*` has its own layout and sidebar.
   - There is **no `/settings`, `/documents`, `/application` or `/super-admin`** route.
3. **Dashboard structure.** **`/` (src/app/page.tsx) is the "giant page".** It is a client-side tab switcher that renders all 12 member views in one route. The URL never changes, so there are no deep links and the back button doesn't work.
4. **Authentication.** `AuthProvider` runs in the browser. `proxy.ts` guards only `/admin/*`. Part 1 fixed the metadata-role and fallback problems.
5. **Database.** See Part 1 §3. There are no application, document or extended-profile tables.
6. **Roles.** Stored in `public.users.role`. After migration 001: `current_app_role()`, `is_admin()`, `is_super_admin()`, and `set_user_role()` (super_admin only).
7. **RLS.** See Part 1 §5. Migration 001 closes the escalation holes.
8. **UI and design system.**
   - Tailwind 4 with CSS tokens in `globals.css`: navy/gold brand plus success, warning, danger and info.
   - Components in `components/ui`: Card, Badge, Button, StatCard, ProgressBar, EmptyState, Input, Select, Table, Avatar, Logo.
   - `Tabs` is a non-functional stub. There is no charting library.
9. **Pages that combine several features.**
   - `/` holds everything.
   - `MembershipView` mixes membership with a mock member directory.
   - `ProfileView` combines viewing and editing.
   - `DashboardView` navigates through tab callbacks.
   - `admin/members` puts the list, a view modal, an edit modal and an add modal on one page.
10. **Route structure.** Member routes go under the route group `(app)`, so URLs are unchanged, with a shared `AppShell`. `/admin` and `/super-admin` use the same shell, and navigation is filtered by the trusted role. `/` redirects to `/dashboard`; `/admin/dashboard` redirects to `/admin`. The existing course, task, event, payment, certificate, community and resource features are kept as their own pages under a "Programs" nav group.
11. **Files to modify.**
    - `app/page.tsx` (becomes a redirect).
    - `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/dashboard`, `app/admin/members`, `app/admin/members/[memberId]`, `app/admin/reports`.
    - `proxy.ts` (guards member and super-admin routes too).
    - `DashboardView` / `ProfileView` / `MembershipView` / `NotificationsView` / `SettingsView` (replaced by dedicated pages).
    - `ui/Tabs`, `ui/EmptyState`.
12. **Files to create.**
    - Layout: `components/shell/*` (AppShell, Sidebar, Header, UserMenu, NotificationBell, nav config).
    - UI: `components/ui/{StatusBadge,PageHeader,Skeleton,ErrorState,Timeline,ConfirmDialog,DataTable,ProgressRing,Breadcrumbs}`.
    - Charts: `components/charts/*` (dependency-free SVG).
    - Data layer: `lib/data/*`.
    - The member, admin and super-admin pages listed in the request.
13. **Database changes.**
    - `004_member_workflow.sql` (additive): profile columns, `member_number`, `membership_applications`, `member_documents` plus a private bucket, enum values, and RLS.
    - `005_workflow_rpcs.sql`: submit/review RPCs that write status, membership, notification and audit together; admin stats and search RPCs; profile-update audit trigger.

## Charts

Charts are plain SVG components built on the existing tokens, with no new dependency. They only render when the data exists; otherwise the page shows an empty state.
