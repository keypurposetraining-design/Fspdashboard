# Administrator workspace

Administrators use `/admin` rather than the member dashboard. Navigation includes
Overview, Members, Payment Approvals, Memberships, Today's Updates, Activity Log,
and Account Settings. Personal membership, applications, enrollment, documents,
and learning tools are not part of the admin workspace.

## Daily process

1. Overview shows member totals, payments awaiting review, active memberships,
   and memberships expiring within 30 days.
2. Members lets admins search, inspect records, and edit allowed profile fields.
   Account roles and identity fields are not profile-edit fields.
3. Payment Approvals shows submitted references and screenshots. Verify receipt
   of funds before approving. Return incorrect references with a reason.
4. Approved 30DC, TTX, and GTX payments activate a one-year membership. Memberships
   contains dates, status, and history.
5. Today's Updates publishes program details and flyers to member dashboards.
6. Activity Log records existing audited workflow actions, including approval and
   membership activation. Profile field grants alone do not create audit events;
   database auditing must be enabled for profile edits if full field history is needed.
7. Account Settings and the header account menu let admins manage their own profile
   and sign-in settings without opening personal enrollment pages.

Account creation is restricted to active super admins in the API and the Add
member action. Role changes and system settings remain in the Super Admin area.
Ordinary admins are redirected away from removed administrative tools. Existing
legacy content data and pages remain available to super admins. Existing database
RLS and RPC authorization rules are unchanged; route/navigation simplification
does not redefine every legacy database permission.

No new SQL migration is needed for these navigation and route changes. Apply
previous migrations 007–010 for profile, payments, and announcement permissions.
