# Production verification — 7 November 2026

## Changes

- Updated Next.js and eslint-config-next from 16.3.0 to 16.4.5 and applied compatible dependency security fixes.
- Activity API rejects malformed JSON, missing/invalid actions and invalid details with HTTP 400 before database access. Proxy IP lists use their first address; unexpected server errors no longer expose internal exception text.
- Added `npm test`, local-only `npm run test:http`, activity API regressions and an isolated activity-log permission test.
- Allowed CommonJS imports in `.cjs` files, matching the test/script format; application lint rules remain enabled.
- Prepared migration 023 to restore authenticated activity-log SELECT/INSERT privileges while preserving existing RLS. **Not applied to production.**

## Passed

- Production build with Next.js 16.4.5, TypeScript and all 64 static pages.
- `npm test`: account settings, authentication initialization/concurrency, signup, redirects/role boundaries, disabled accounts, membership dates/CSV, configuration, navigation, scheduling and unsorted table rendering. Tests use isolated stubs/rendering, not live authenticated browser sessions.
- Isolated PostgreSQL workflow suite: enrollment, free registration, duplicate submission handling, fee snapshots, receipt review, approval, resubmission, notification reads, RLS isolation and migration re-runs through migration 017.
- Isolated tests of migrations 022/023: own activity insert/read, cross-user isolation, blocked edits/deletes, anonymous failed-login-only writes and idempotency.
- Local HTTP smoke: six public pages, six protected routes redirecting anonymous users to login and two authenticated APIs returning 401.
- Local load check: 200 successful public-page requests, concurrency 10, 1,372 ms total, p50 64 ms, p95 98 ms, maximum 111 ms. These measurements do not establish authenticated database capacity or production traffic limits.
- Production read-only smoke before deployment: login/signup/about/privacy/terms returned 200; admin and super-admin paths redirected anonymous requests to login.
- Production dependency audit: zero reported vulnerabilities (`npm audit --omit=dev`).
- Lint of changed application/testing code passed.

## Remaining work / access needed

1. Full repository lint still fails with **139 errors and 70 warnings**, largely legacy explicit `any` types and React hook issues. This audit does not certify the entire codebase lint-clean.
2. Full dependency audit retains eight moderate development-toolchain findings through minimatch/TypeScript ESLint. The suggested forced fix downgrades eslint-config-next across major versions; it was not applied.
3. Vercel production currently contains only the public Supabase URL/key. `SUPABASE_SERVICE_ROLE_KEY` is required by the existing account-creation API. Configure it as a server-only Production secret and redeploy; never give it a NEXT_PUBLIC prefix.
4. Apply `database/migrations/023_authenticated_activity_log_permissions.sql` as database owner. The connected environment has no Supabase database execution access. Production logs previously confirmed authenticated activity inserts failing on table permissions.
5. No connected browser session or disposable authenticated member/admin/super-admin test accounts were available. Real browser uploads, email delivery, Google OAuth, payment approval and authenticated end-to-end load remain unverified. No real member records or payments were changed by this audit.
6. Database suites use an in-memory prior-schema fixture. They do not prove that every migration, policy or setting is installed correctly in the live Supabase project; migrations 018–021 were not exercised by the existing enrollment harness.

## Repeat checks

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run lint
npm.cmd audit --omit=dev
# In another terminal, after build:
npm.cmd run start -- --port 3100
npm.cmd run test:http
```

The PostgreSQL runners accept the directory of an independently installed `@electric-sql/pglite` package:

```powershell
node database/tests/run-enrollment-check.mjs PATH_TO_PGLITE_PACKAGE
node database/tests/activity-log-permissions.mjs PATH_TO_PGLITE_PACKAGE
```
