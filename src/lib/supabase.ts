import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-only Supabase singleton used by the auth provider.
 *
 * IMPORTANT: uses the @supabase/ssr browser client (not @supabase/supabase-js
 * createClient) so that the auth session is persisted to cookies. The /admin
 * proxy (src/proxy.ts) reads the session from cookies server-side, so without
 * this the proxy can never see a signed-in user and bounces /admin/* back to
 * /login after every successful login.
 *
 * Must only be imported from client components.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);
