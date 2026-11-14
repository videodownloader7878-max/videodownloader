import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, hasRole, sameOrigin } from "@/lib/auth";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const p = await getProfile();
  if (!p) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = createClient();
  await sb.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", p.id);
  if (hasRole(p, "editor")) await sb.from("activity_logs").insert({ actor_id: p.id, action: "admin_login", entity_type: "profile", entity_id: p.id });
  return NextResponse.json({ ok: true });
}
