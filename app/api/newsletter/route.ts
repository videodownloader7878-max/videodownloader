import { NextResponse } from "next/server";
import { clientIp, EMAIL_RE } from "@/lib/request";
import { limited } from "@/lib/rateLimit";
import { sameOrigin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGeneralFresh } from "@/lib/settings";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await getGeneralFresh()).newsletter_enabled) return NextResponse.json({ error: "Newsletter signup is currently unavailable." }, { status: 403 });
  if (limited(clientIp(req) + "n", 5, 600_000)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  let b: { email?: unknown; consent?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (b.consent !== true) return NextResponse.json({ error: "Please tick the box to agree to receive emails." }, { status: 400 });
  const sb = createAdminClient();
  const { data: ex } = await sb.from("newsletter_subscribers").select("id,status").eq("email", email).maybeSingle();
  const now = new Date().toISOString();
  const { error } = ex
    ? ex.status === "subscribed" ? { error: null } : await sb.from("newsletter_subscribers").update({ status: "subscribed", consent_at: now }).eq("id", ex.id)
    : await sb.from("newsletter_subscribers").insert({ email, status: "subscribed", consent_at: now });
  if (error) return NextResponse.json({ error: "Couldn’t subscribe right now. Try again later." }, { status: 500 });
  return NextResponse.json({ ok: true }); // same answer for new and existing emails
}
