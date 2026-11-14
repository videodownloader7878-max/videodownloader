import "server-only";
import { createClient } from "@supabase/supabase-js";
// Service-role client: bypasses RLS. Server routes only. Never import from client components.
export const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
