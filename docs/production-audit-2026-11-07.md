# Production verification — 7 November 2026

## Current result

Application checks, isolated workflow suites and the live functional checks listed below passed. Email receipt and final Google sign-in were confirmed by the user. Real-backend load testing remains unrun because there is no separate test backend.

## Changes

- Next.js and eslint-config-next are on patched 16.4.5. The development-only TypeScript ESLint minimatch dependency is overridden to 11.0.5; the complete npm audit reports zero vulnerabilities.
- Resolved all 139 remaining lint errors and 70 warnings without disabling application lint rules. Older screens now use explicit row types, stable loader callbacks and derived search results instead of duplicate state. Fixed activity/sync error handling and typed shared controls.
- Fixed member resource downloads to use the actual `resources.url` column.
- Made older admin user embeds explicit using `members_user_id_fkey` / `community_posts_user_id_fkey`, avoiding ambiguous joins where audit columns also reference users.
- Associated the role-dialog reason label with its input and restored visible branding in the mobile header.
- Added repeatable unit/render, HTTP, database and browser test commands.
- Prepared migration 023 for authenticated activity-log privileges. It is tested; the user reports applying it to production, but authenticated live logging has not been independently verified.

## Verification passed

- `npm run lint -- --max-warnings 0`: zero errors and warnings.
- Production build, TypeScript and generation of all 64 static pages.
- `npm test`: account settings, auth concurrency/bootstrap, signup and password validation, role routing/disabled accounts, unsafe redirects, membership dates/CSV, configuration, scheduling, navigation and unsorted table rendering.
- In-memory PostgreSQL: historical base schema plus every migration 001–023, repeat application, organization isolation, membership RPC authorization, retired organization access, unauthorized role promotion rejection, successful super-admin promotion and last-super-admin protection.
- Separate PostgreSQL workflow suite: enrollment, duplicate submissions, fee snapshots, private receipts, corrections/resubmission, payment approval, owner isolation and notifications.
- Separate activity-grant suite: authenticated own-row writes/reads, cross-user isolation, anonymous failed-login-only inserts, no edits/deletes, and migration idempotency.
- Headless Chromium-based browser (installed Edge fallback): separate member/admin/super-admin sessions, real email/password UI against a localhost auth fixture, member routes, resource popup, forbidden-role redirects, admin tables, program image upload/save, announcement publishing and payment approval. These tests check frontend wiring against an isolated API fixture; SQL authorization is tested independently in PostgreSQL.
- Mobile viewport 390×844: menu navigation, no horizontal overflow, role-change dialog, rejection of a missing reason, successful test promotion with a reason; desktop/mobile screenshots visually inspected.
- Authenticated local load: 100 requests, concurrency 10, zero failures; latest p95 192 ms against the fixture backend. Earlier public-page load: 200 requests, concurrency 10, zero failures, p95 98 ms. Neither establishes real Supabase capacity or production traffic limits.
- Public production smoke: login/signup/about/privacy/terms return 200; admin/super-admin routes redirect anonymous requests to login; protected APIs reject anonymous users; malformed activity input returns 400 without a database write.
- `npm audit`: zero reported vulnerabilities across production and development dependencies.
- Additional live read-only audit matched local public configuration to deployed JavaScript before probing Supabase. Anonymous SELECT was denied on users, members, memberships, payments, member_activity_logs, audit_logs, member_documents, membership_applications and offering_enrollments. No objects were visible in anonymous listings of program-flyers, task-submissions and member-documents. Empty listings do not establish bucket existence, private flags or authenticated upload/read success.
- Live authentication settings show email and Google enabled, with email auto-confirm disabled. The Google authorization endpoint returned HTTP 302 to accounts.google.com. The redirect was not followed; no actual Google login or email delivery was performed.

## Live integration results

- The server-only Supabase key is confirmed as a hidden Production Secret, and production was redeployed with it.
- Migration 024 was applied by the user. A live request through the account-creation API then returned HTTP 200 and created one approved disposable Member. Its generated credentials were saved only in the ignored local test file. The pending membership and MEMBER_CREATED audit entry were independently verified.
- Live disposable Member, Admin and Super Admin accounts all passed password sign-in, own trusted profile/role, active-status and own-prefix storage listing checks. The user-approved Admin test role assignment succeeded. The older conflicting Member profile was left intact.
- A real temporary one-pixel image in the disposable Member's private task-submissions folder passed upload, authenticated byte-for-byte download, signed URL byte-for-byte download and anonymous denial. Only this generated object was removed; a follow-up read confirmed removal. No task or payment was submitted.
- One password-reset test email was explicitly authorized by the user. Supabase accepted the request and the user confirmed inbox receipt. No password was changed and no reset token was collected.
- The Google authorization start was independently verified as HTTP 302 to Google. The user then completed Google sign-in and confirmed that the dashboard opened. This final browser/provider step is user-confirmed, not an agent-observed connected browser session.
- Existing member business data, payments and announcements were not used for destructive testing. Only explicitly approved disposable test-account setup, its membership/audit records, login sessions and the temporary storage object were used.

- Production error-log check after the latest live tests returned no error entries in the preceding five-minute window. This only covers the available log window.

## Remaining limitation

**Real Supabase/backend capacity testing has not been performed.** The user confirmed that no separate test backend exists. Production was not stress-tested. Local/fixture load checks passed, but their timings do not establish production capacity. A separate Supabase test project/backend with representative synthetic data is required for this remaining check.

These are scoped verification results, not a guarantee that every possible workflow or failure mode is covered.

## Repeat checks

```powershell
npm.cmd run lint -- --max-warnings 0
npm.cmd test
npm.cmd run build
npm.cmd audit
node scripts/check-live-readonly.mjs
npm.cmd run start -- --port 3100
# In a second terminal:
npm.cmd run test:http
```

Database/browser tools are installed outside the project, with no runtime dependency:

```powershell
npm.cmd install --prefix "$env:TEMP/fsp-audit-tools" --no-package-lock --no-audit --no-fund @electric-sql/pglite@0.5.15 @playwright/test@1.65.0
npm.cmd run test:database -- "$env:TEMP/fsp-audit-tools/node_modules/@electric-sql/pglite"
npm.cmd run test:browser -- "$env:TEMP/fsp-audit-tools/node_modules/playwright"
```

The browser suite uses a dedicated localhost API on port 54329 and application on port 3130, refuses external browser traffic, and makes a local fixture build. It uses installed Edge if its downloaded Chromium is unavailable. Re-run `npm run build` after browser tests to restore normal local build settings before release. Do not use `--skip-build` unless the existing build was generated by the browser fixture.
