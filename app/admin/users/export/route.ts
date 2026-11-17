import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/audit";
export const dynamic = "force-dynamic";
const ROLES = ["super_admin", "admin", "editor", "user"];
// Spreadsheet formulas are neutralised (CSV injection) and no passwords or tokens exist in this data.
const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
export async function GET(req: Request) {
  const me = await authorize("admin");
  if (!me) return new NextResponse("Forbidden", { status: 403 });
  const url = new URL(req.url); const role = url.searchParams.get("role") ?? ""; const s = (url.searchParams.get("q") ?? "").replace(/[^\p{L}\p{N}@.\-_ ]/gu, "").slice(0, 60);
  const sb = createClient();
  let q = sb.from("profiles").select("id,full_name,email,role,is_active,email_verified,created_at,last_login_at").order("created_at", { ascending: false }).limit(5000);
  if (ROLES.includes(role)) q = q.eq("role", role);
  if (s) q = q.or(`email.ilike.%${s}%,full_name.ilike.%${s}%`);
  const { data, error } = await q;
  if (error) return new NextResponse("Export failed", { status: 500 });
  const head = ["id", "name", "email", "role", "active", "email_verified", "registered", "last_login"];
  const csv = [head.join(","), ...(data ?? []).map((u) => [u.id, u.full_name, u.email, u.role, u.is_active, u.email_verified, u.created_at, u.last_login_at].map(cell).join(","))].join("\n");
  await logActivity(sb, me.id, "users_export", "profile", undefined, { rows: data?.length ?? 0 });
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="users.csv"', "Cache-Control": "no-store" } });
}
