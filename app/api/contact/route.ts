import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { clientIp, EMAIL_RE } from "@/lib/request";
import { limited } from "@/lib/rateLimit";
import { sameOrigin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGeneralFresh } from "@/lib/settings";
export const dynamic = "force-dynamic";
const strip = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "");
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await getGeneralFresh()).contact_enabled) return NextResponse.json({ error: "The contact form is currently unavailable." }, { status: 403 });
  const ip = clientIp(req);
  if (limited(ip + "c", 3, 600_000)) return NextResponse.json({ error: "Too many messages. Please try again in a few minutes." }, { status: 429 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  // Spam traps: hidden field filled, or form submitted faster than a person can type. Pretend success.
  if (b.website || (typeof b.elapsed === "number" && b.elapsed < 3000)) return NextResponse.json({ ok: true });
  if (process.env.TURNSTILE_SECRET_KEY) { // optional captcha: enforced only when the secret key is configured
    let human = false;
    try { const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: typeof b.token === "string" ? b.token : "", remoteip: ip }), signal: AbortSignal.timeout(5000) }); human = !!(await r.json()).success; } catch {}
    if (!human) return NextResponse.json({ error: "Please complete the captcha and try again." }, { status: 400 });
  }
  const name = strip(b.name, 100), email = strip(b.email, 254), subject = strip(b.subject, 150), message = strip(b.message, 5000);
  if (!name || !EMAIL_RE.test(email) || !subject || message.length < 10) return NextResponse.json({ error: "Please fill in every field. The message needs at least 10 characters." }, { status: 400 });
  const ip_hash = createHash("sha256").update(ip + (process.env.HASH_SALT ?? "")).digest("hex").slice(0, 32);
  const { error } = await createAdminClient().from("contact_messages").insert({ name, email, subject, message, ip_hash });
  if (error) return NextResponse.json({ error: "We couldn’t send your message. Please try again later." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
