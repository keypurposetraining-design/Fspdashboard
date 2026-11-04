# Account settings and organization retirement

Organizations has been removed from member and management navigation. Its
pages, forms, server actions and dedicated data-access/validation modules were
removed. Old organization links return signed-in users to their role's home.
The shared login also rejects organization URLs as a return destination.

## Database retirement

Run `database/migrations/021_retire_organizations.sql` in Supabase SQL Editor
after the existing migrations. It revokes API access to organization tables
and organization management functions for public, anonymous, authenticated and
service-role callers. It skips objects that are not installed.

No account, membership, course, enrollment, payment or audit records are deleted.
Historical organization tables remain because migration 019 added foreign keys
and defaults from core tables. `platform_org_id()` remains callable for those
defaults; disabling it would break normal profile, membership and course inserts.
Do not use DROP CASCADE to retire this feature. Apply migration 021 last if older
grant migrations are rerun.

The migration was prepared locally. It has not been executed against the live
database because this workspace has public Supabase credentials only. Run
`database/tests/021_retire_organizations.sql` after applying it to check grants.
The old `019_org_foundation.sql` database tests describe the feature before
retirement and are not applicable after 021.

## Account settings

Admins and super admins use `/admin/account`:

- Name, email, trusted role and sign-in method.
- View profile and edit profile using routes under `/admin/account/profile`.
- Password change with length/matching validation and show/hide controls for
  email/password accounts. Google-only accounts explain that Google manages
  their password.
- Sign-out confirmation for the current device.

The unavailable notification-preferences section and admin member-number rows
were removed. The member Settings page retains its member number. Profile
save, cancel and breadcrumb links now remain in the correct admin/member area.
The optional professional employer field is called Company / workplace; it is
plain profile text, not organization management.

## Validation

`node --test tests/account-settings.cjs tests/auth-routing.cjs tests/signup-flow.cjs`
checks role-specific account links, password validation/success using an isolated
auth stub, Google-only messaging, sign-out confirmation, retired organization
navigation and shared sign-in flows. No real passwords or accounts are changed.
Route type generation, TypeScript and targeted ESLint checks also run locally.
Live account writes and database retirement must be verified in the connected
Supabase project after migration 021.
