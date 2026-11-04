# Admin user and membership management

## Database setup

Apply `database/migrations/020_admin_membership_management.sql` in the Supabase SQL editor after migrations 001–019. It runs in a transaction and can be rerun. No service-role key belongs in browser configuration. The new RPCs read the caller's active trusted role before returning account data or writing memberships; anonymous calls cannot execute them.

This migration adds three functions. It does not modify existing membership dates, activate unapproved accounts, or create memberships in bulk. Registered accounts come from authentication records, including accounts whose public profile sync failed. Assigning a membership retries the existing profile sync; unresolved email conflicts produce an error rather than creating a duplicate account.

## Admin process

Open `/admin/memberships`. All registered email accounts appear, including users without memberships and administrator accounts. Registration, last successful login, and connected sign-in methods come from Supabase authentication records. Counts and filters include all loaded accounts; table pages contain 25 accounts. CSV exports all matching accounts, across table pages.

Choose **Assign membership** for a user without a term. Select the original start date for an existing member, choose a status, provide a reason and save. Expiry is one calendar year later (February 29 becomes February 28). An active term that ended before today saves as expired. Use **Edit / approve** to correct dates, approve a pending membership, suspend, or cancel. Dates and status save together with an audit entry and member notification in one database transaction.

**Renew** creates a new term and keeps the old term in history. The default start is the previous expiry; the admin can choose a later date. Earlier dates require editing the existing term. The latest term is the one displayed by the existing member portal. A future-dated active renewal is recorded immediately, consistent with the portal's existing active-status rules; use pending if it must await approval. Scheduled activation is not implemented.

**View history** shows membership terms, the latest 100 recorded login/logout events and latest 100 membership audit entries. Last successful login is available even when historical events were not recorded. Google OAuth callbacks now record successful login events; email login records its sign-in method. Old events cannot be reconstructed. Authentication provider lists show connected methods, not necessarily the method used for the most recent login.

**Profile** opens the existing profile, application, documents and activity views. **Payments** opens payment administration.

## Validation

Run `node tests/membership-dates.cjs`, `npx tsc --noEmit` and targeted ESLint checks.

After applying the migration, verify with real admin/member sessions:

1. Admin sees an existing Google account with no membership; a member calling any new RPC receives an authorization error, and anonymous execution is denied.
2. Assign a backdated term; confirm automatic expiry, the displayed member dates, audit reason/actor and notification.
3. Correct dates, then suspend/cancel and verify the displayed status. Test February 29.
4. Renew an expired term; confirm the previous term remains in history. Two tabs editing the same account should reject stale assignment/renewal IDs.
5. Sign in through Google and email; verify last successful login and activity history without extra events on page refresh.
6. Filter/search, page through results and export CSV. A failed RPC must show an error rather than an empty-success state.

Database execution and authenticated end-to-end checks require Supabase database access and are not completed by local type/lint checks.
