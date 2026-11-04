# Registration and sign-in

1. Open `/login` and select **New here? Sign up — Create an account**.
2. Enter full name, email, password (at least eight characters), and matching password confirmation. Both password fields have show/hide controls.
3. Submit **Create account**. When email confirmation is enabled, check the inbox/spam folder and open the confirmation link in the same browser used to register. The callback signs the user in and opens the dashboard. If confirmation is disabled, successful registration opens the dashboard immediately.
4. For later visits, sign in at `/login` with email/password or the existing Google sign-in button. Use **Forgot password?** if needed.
5. Registration creates a member account through the existing database sync. Membership approval and dates remain separate admin actions. All existing accounts sign in at `/login`: members land on `/dashboard`, admins on `/admin`, and super admins on `/super-admin`. Old `/login/admin` bookmarks redirect to this shared login.

## Configuration

Supabase Authentication must allow email sign-up. Add the exact development/production callback URLs to Authentication URL Configuration, including `http://localhost:3000/auth/callback` locally. Ensure confirmation email delivery and templates are configured. The confirmation link must preserve the authorization code for the existing PKCE callback.

Apply the existing user-sync migration (`002_user_sync.sql`) for account/profile creation and migration `020_admin_membership_management.sql` for the admin user and membership list. The frontend never sends an administrator role during registration.

## Checks

`node --test tests/signup-flow.cjs` runs seven isolated component behavior tests covering registration validation, normalized email/name, confirmation, immediate-session redirect, existing account handling, retryable errors, the login footer, and email sign-in handling. Auth calls are stubbed; these tests do not create live accounts or send email.

TypeScript and targeted ESLint checks pass. Local HTTP/render checks verify both routes respond and show the expected fields/links. Supabase public settings were checked: email sign-up is enabled and email confirmation is required.

Live delivery of a confirmation email and final authenticated access must still be checked with an email address controlled by the tester. Browser automation was unavailable during this session, so these checks do not claim a complete live browser registration.
