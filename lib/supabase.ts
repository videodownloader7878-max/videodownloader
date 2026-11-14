import { createClient } from "@supabase/supabase-js";
// Returns null when env vars are missing, so the site still builds and shows empty states.
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false }, global: { fetch: (u, i) => fetch(u, { ...i, next: { revalidate: 60 } }) } }) : null;
}
