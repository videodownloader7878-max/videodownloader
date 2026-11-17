import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/audit";
export const dynamic = "force-dynamic";
const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
// Only people who are currently subscribed AND have a recorded consent time are exported.
export async function GET() {
  const me = await authorize("admin");
  if (!me) return new NextResponse("Forbidden", { status: 403 });
  const sb = createClient();
  const { data, error } = await sb.from("newsletter_subscribers").select("email,consent_at,created_at").eq("status", "subscribed").not("consent_at", "is", null).order("created_at").limit(50000);
  if (error) return new NextResponse("Export failed", { status: 500 });
  const csv = ["email,consent_at,subscribed_at", ...(data ?? []).map((r) => [r.email, r.consent_at, r.created_at].map(cell).join(","))].join("\n");
  await logActivity(sb, me.id, "newsletter_export", "newsletter_subscriber", undefined, { rows: data?.length ?? 0 });
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="subscribers.csv"', "Cache-Control": "no-store" } });
}
