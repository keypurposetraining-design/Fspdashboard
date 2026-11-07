# Production verification — 7 November 2026

## Current result

Application checks and isolated workflow tests pass. Live Supabase setup and live provider delivery checks remain blocked by missing access; this is not a claim that every production integration is verified.

## Changes

- Next.js and eslint-config-next are on patched 16.4.5. The development-only TypeScript ESLint minimatch dependency is overridden to 11.0.5; the complete npm audit reports zero vulnerabilities.
- Resolved all 139 remaining lint errors and 70 warnings without disabling application lint rules. Older screens now use explicit row types, stable loader callbacks and derived search results instead of duplicate state. Fixed activity/sync error handling and typed shared controls.
- Fixed member resource downloads to use the actual `resources.url` column.
- Made older admin user embeds explicit using `members_user_id_fkey` / `community_posts_user_id_fkey`, avoiding ambiguous joins where audit columns also reference users.
- Associated the role-dialog reason label with its input and restored visible branding in the mobile header.
- Added repeatable unit/render, HTTP, database and browser test commands.
- Prepared migration 023 for authenticated activity-log privileges. It is tested but has **not been applied to the live database**.

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

## Live-only work still blocked

1. Vercel production has only the public Supabase URL/key. The existing account-creation endpoint requires a server-only `SUPABASE_SERVICE_ROLE_KEY`. Configure it in Vercel Production and redeploy; never prefix it NEXT_PUBLIC or paste it into chat.
2. Apply `database/migrations/023_authenticated_activity_log_permissions.sql` in the production Supabase SQL editor as database owner. No Supabase management token, database password/connection, or service-role key is available in this workspace. Production activity-log table permission errors were confirmed in the earlier logs.
3. The supplied website URL is the live production site, not a separate test backend. No connected live browser session or disposable accounts/credentials are available. Real Google OAuth, actual email delivery, real storage/database integration and authenticated production capacity are not certified by the isolated browser tests. No real member records, payments or notifications were changed by testing.

## Repeat checks

```powershell
npm.cmd run lint -- --max-warnings 0
npm.cmd test
npm.cmd run build
npm.cmd audit
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
