import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/auth";
import { clientIp, EMAIL_RE } from "@/lib/request";
import { limited } from "@/lib/rateLimit";
import { getGeneralFresh } from "@/lib/settings";
export const dynamic = "force-dynamic";
// Always creates a normal "user" (the database trigger assigns the role; nothing from the request can change it).
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (limited(clientIp(req) + "s", 5, 600_000)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  if (!(await getGeneralFresh()).registration_enabled) return NextResponse.json({ error: "Registration is closed." }, { status: 403 });
  let b: { email?: unknown; password?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "", password = typeof b.password === "string" ? b.password : "";
  if (!EMAIL_RE.test(email) || email.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 12 || password.length > 200) return NextResponse.json({ error: "Password must be 12 to 200 characters." }, { status: 400 });
  const { error } = await createClient().auth.signUp({ email, password });
  if (error) return NextResponse.json({ error: "Couldn’t create the account. Try a different email or password." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
