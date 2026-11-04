# Multi-tenant organization foundation

> Retired: this document describes the historical migration 019. Organization
> pages, server actions and app data-access modules have been removed. Apply
> `021_retire_organizations.sql` after existing migrations to revoke the retired
> feature's API access. See `account-settings-and-organization-retirement.md`.

Adds organizations, organization-scoped roles, server-side authorization and an
org-scoped audit trail. The existing single-tenant FSP portal keeps working:
FSP becomes the first organization and existing rows are adopted into it.

## Apply in Supabase

Run each complete file separately in SQL Editor, in order. Stop at the first
error.

1. `database/migrations/018_restore_api_grants.sql`
2. `database/migrations/019_org_foundation.sql`

`018` must be applied at least once because this project's `public` schema was
rebuilt with `DROP SCHEMA public CASCADE`, which also removed the
`ALTER DEFAULT PRIVILEGES` entries Supabase relies on. Without it, tables
created by later migrations carry no API privileges and every read fails with
`42501 permission denied`. `018` restores those defaults and is safe to re-run.

`019` is also safe to re-run: it uses `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`
and `CREATE OR REPLACE` throughout.

### What 019 changes

| Object | Purpose |
| --- | --- |
| `organizations` | Tenants. Exactly one row has `kind = 'platform'` (FSP). |
| `organization_memberships` | Which account holds which role in which organization. |
| `client_organizations` | A tenant's own customers. Records, not sign-in tenants. |
| `trainer_profiles` | Professional profile for one trainer membership. |
| `audit_events` | Append-only, org-scoped administrative trail. |

It also adds a nullable `org_id` to `members`, `memberships`,
`membership_applications`, `member_documents`, `member_updates`, `offerings`,
`offering_enrollments` and `events`, backfills it to the FSP organization, and
defaults it to `platform_org_id()`. Nullable on purpose: the existing portal
continues to work while call sites are migrated.

Every existing active account receives an active FSP membership —
`admin`/`super_admin` as `owner`, `trainer` as `trainer`, everyone else as
`learner`.

## Roles

Platform role (`public.users.role`) and organization role are separate axes.
`users.role` is unchanged and still only settable through `set_user_role()`.

| Requirement | Where it lives |
| --- | --- |
| FSP platform administrator | `users.role in ('admin','super_admin')` |
| Organization owner | `organization_memberships.role = 'owner'` |
| Trainer | `organization_memberships.role = 'trainer'` |
| Client stakeholder | `organization_memberships.role = 'stakeholder'` |
| Learner | `organization_memberships.role = 'learner'` |

`org_admin` exists as a delegated administrator below `owner`.

Platform administrators can **read** every organization but hold no implicit
organization role: managing one still requires `owner` or `org_admin` inside
it. This is asserted by the test suite.

## How authorization is enforced

Three independent layers, so a mistake in one does not leak data:

1. **`src/proxy.ts`** — an optimistic session check only. Next.js documents
   Proxy as not a security boundary.
2. **`src/lib/org/dal.ts`** — the real gate. `verifySession()` validates the
   token with Supabase rather than trusting the cookie, and
   `resolveOrgContext()` matches a requested org id or slug against the
   caller's own memberships. An identifier from the browser is treated as an
   *identifier*, never as a claim, so a substituted value resolves to nothing.
3. **RLS plus `SECURITY DEFINER` RPCs** — the new tables are read-only to the
   API (`REVOKE ALL`, then `GRANT SELECT`). All writes go through RPCs that
   re-derive authority from `auth.uid()`.

Server Actions are written as untrusted POST endpoints: each validates its
payload and re-authorizes before touching data.

## Run the tests

The suites follow the existing convention in `database/tests`: fixtures inside
a transaction, `SET LOCAL ROLE authenticated` with
`set_config('request.jwt.claim.sub', ...)` to impersonate, and `ROLLBACK` at
the end. Nothing is left behind.

Against a development database:

```bash
psql "$DEV_DATABASE_URL" -v ON_ERROR_STOP=1 -f database/tests/019_org_foundation.sql
```

Exit code 0 means every assertion held. `019_org_foundation.sql` covers
unauthenticated access, cross-organization reads and writes, role enforcement,
invitation flow, last-owner protection, suspension, platform-admin scope,
audit append-only behaviour, and the grant surface.

## Local development

```bash
npm install
# .env.local needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Then sign in and open `/organizations`. A fresh account belongs to no
organization until an owner invites it, or it creates one.

New routes: `/signup`, `/forgot-password`, `/reset-password`, `/organizations`,
`/organizations/[slug]/settings`. All five are listed in `PUBLIC_PATHS` in
`src/proxy.ts` where they must be reachable without a session.

Supabase **Authentication → URL Configuration** must allow the redirect URLs
for the port the dev server actually uses. `next dev` falls back to 3001 when
3000 is taken, so add both:

```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

Pin the port with `next dev -p 3000` to avoid the moving target.
