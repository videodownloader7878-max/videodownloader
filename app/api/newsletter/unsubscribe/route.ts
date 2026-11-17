import { NextResponse } from "next/server";
import { clientIp } from "@/lib/request";
import { limited } from "@/lib/rateLimit";
import { sameOrigin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!sameOrigin(req) || limited(clientIp(req) + "u", 10, 600_000)) return NextResponse.json({ error: "Try again later." }, { status: 429 });
  try {
    const { token } = await req.json();
    if (typeof token === "string" && /^[0-9a-f-]{36}$/i.test(token)) await createAdminClient().from("newsletter_subscribers").update({ status: "unsubscribed" }).eq("unsubscribe_token", token);
  } catch {}
  return NextResponse.json({ ok: true });
}
