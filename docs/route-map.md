# FSP Dashboard Route Map

Every signed-in page renders inside the shared `AppShell` (`src/components/shell/`). The shell provides a sidebar (a drawer on mobile), a header with page search, a notification bell and a user menu, and loading and access states.

**Access is enforced in four layers:**

1. `src/proxy.ts` on the server. It reads the role from `public.users` and never from user metadata.
2. RLS on every table.
3. `SECURITY DEFINER` RPCs for every state change (`database/migrations/001`–`005`).
4. The UI, which only hides navigation.

## Public

| Route | Purpose |
|---|---|
| `/login` | Shared member, admin and super-admin sign-in (Google or email). Defaults: `/dashboard`, `/admin`, `/super-admin` by trusted role. |
| `/login/admin` | Compatibility redirect to `/login`; no separate sign-in form |
| `/auth/callback` | Code exchange, then role-aware redirect. Return paths must be local and appropriate for the role. |
| `/` | Redirects to `/dashboard` |

## Member area: `src/app/(member)/`

Any signed-in, active account can use these routes.

| Route | Purpose |
|---|---|
| `/dashboard` | Overview: status cards, required actions, recent activity, membership summary |
| `/profile` | View your profile and profile completion |
| `/profile/edit` | Edit the permitted profile fields and photo |
| `/application` | Application status, step timeline, action required, start an application |
| `/application/[id]` | Application detail, edit the draft or requested changes, submit |
| `/membership` | Membership card, validity, renewal, history |
| `/documents` | Required documents: upload, re-upload, view (signed URLs) |
| `/notifications` | Tabs (All / Unread / Membership / Application / Documents / System), mark read |
| `/settings` | Account, security (password for email accounts), session |
| `/courses`, `/tasks`, `/events`, `/payments`, `/certificates`, `/community`, `/resources` | Existing program features, shown under "Programs" in the sidebar |
| `/membership/register` | Redirects to `/application` |

## Admin area: `src/app/admin/`

Limited to the `admin` and `super_admin` roles.

| Route | Purpose |
|---|---|
| `/admin` | KPIs, new members chart, application status, recent applications, pending actions |
| `/admin/members` | Server-side search, filter, sort and pagination (`?q=&membership=&application=&sort=&desc=&page=`) |
| `/admin/members/new` | Create a member via `POST /api/admin/members`. The allowed roles are checked on the server. |
| `/admin/members/[memberId]` | Tabs: Overview, Profile, Application, Membership, Documents, Activity |
| `/admin/applications` | Approval queue (`?tab=review\|changes\|approved\|rejected\|all`) |
| `/admin/applications/[id]` | Review page with decisions: start review, approve, request changes, reject |
| `/admin/documents` | Document review queue (`?tab=pending\|approved\|rejected\|all`) |
| `/admin/reports` | Date-filtered charts and KPIs |
| `/admin/memberships` and the Content & Operations pages | Existing admin tools |
| `/admin/dashboard` | Redirects to `/admin` |

**Rules the database enforces on decisions:**

- A reason is required to reject or to request changes.
- Admins cannot review their own application or documents.
- Approving an application activates the membership.

## Super admin area: `src/app/super-admin/`

Limited to the `super_admin` role.

| Route | Purpose |
|---|---|
| `/super-admin` | Overview: role counts, sync issues, recent access and settings changes |
| `/super-admin/admins` | Promote, demote, disable and enable admins (via `set_user_role`, reason required, audited) |
| `/super-admin/users` | All users, with role and access changes |
| `/super-admin/settings` | Membership term, renewal fee, other settings (audited) |
| `/super-admin/audit-logs` | Full audit log with filters and a detail view (read-only, append-only) |
| `/super-admin/security` | Sign-in sync issues, privileged accounts, recent access changes |
