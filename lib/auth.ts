import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export type Role = "super_admin" | "admin" | "editor" | "user";
export type Profile = { id: string; email: string; full_name: string | null; role: Role; is_active: boolean };
const rank: Record<Role, number> = { user: 0, editor: 1, admin: 2, super_admin: 3 };
export const hasRole = (p: Profile | null, min: Role) => !!p && rank[p.role] >= rank[min];
// getUser() re-validates the session with Supabase; role is read from the database, never from the browser.
export async function getProfile(): Promise<Profile | null> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("id,email,full_name,role,is_active").eq("id", user.id).single();
  return data && data.is_active ? (data as Profile) : null;
}
// For pages/layouts: redirects when not allowed.
export async function requireRole(min: Role) {
  const p = await getProfile();
  if (!p) redirect("/signin?next=/admin");
  if (!hasRole(p, min)) redirect("/");
  return p;
}
// For API routes: returns the profile or null (respond 401/403 yourself). Call on EVERY protected endpoint.
export async function authorize(min: Role) { const p = await getProfile(); return hasRole(p, min) ? p : null; }
// CSRF guard for cookie-authenticated POST routes.
export function sameOrigin(req: Request) {
  const o = req.headers.get("origin");
  return !o || new URL(o).host === req.headers.get("host");
}
