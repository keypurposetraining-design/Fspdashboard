// Construct the SSR browser client only when it is used, rather than while
// evaluating imports for every route (including the static not-found page).
// @supabase/ssr reuses its browser singleton and persists auth through cookies.
export { createClient } from "@/lib/supabase/client";
