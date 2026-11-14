import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, hasRole, sameOrigin } from "@/lib/auth";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const p = await getProfile();
  const sb = createClient();
  if (p && hasRole(p, "editor")) await sb.from("activity_logs").insert({ actor_id: p.id, action: "admin_logout", entity_type: "profile", entity_id: p.id });
  await sb.auth.signOut();
  return NextResponse.json({ ok: true });
}
