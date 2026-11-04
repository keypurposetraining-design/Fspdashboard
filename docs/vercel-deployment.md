# Vercel deployment

The Supabase URL and public key must be configured in Vercel before building.
`.env.local` is deliberately ignored by Git and is not uploaded with the source.
Values in `.env.example` are placeholders, not working credentials.

1. Open the Vercel project, then **Settings > Environment Variables**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, using the
   real values from your local `.env.local` or the Supabase project's API settings.
3. Select **Production**. Also select **Preview** if preview deployments are used.
4. Save both variables and create a fresh deployment. Public variables are built
   into browser assets, so changing them requires a rebuild/redeploy.
5. In Supabase Authentication URL Configuration, set the production Site URL and
   allow `https://YOUR-DEPLOYMENT-DOMAIN/auth/callback` and
   `https://YOUR-DEPLOYMENT-DOMAIN/reset-password` for confirmation, Google sign-in
   and password recovery.

The optional `SUPABASE_SERVICE_ROLE_KEY` is only needed for server-side privileged
account creation. Never expose it under a `NEXT_PUBLIC_` name or commit it.

## Project settings

- Framework: Next.js
- Build command: `npm run build`
- Root directory: the directory containing `package.json`
- Git repository/branch: the repository that contains your current fixes, `main`

The reported build log cloned `keypurposetraining-design/fspcommunitydashboard`.
The repository previously pushed from this workspace is
`yogiyogesh4002/FSPDASHBOARD`. Check Vercel's Git settings; changes pushed to one
repository do not automatically appear in the other.

`npm run build` now checks configuration before compilation and prints the
missing variable names without exposing their values. Browser clients are
initialized when used, rather than at import time during static prerendering.
Configured production builds and static not-found generation are verified locally.

Reference: https://vercel.com/docs/environment-variables/managing-environment-variables
