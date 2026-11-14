import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
export const dynamic = "force-dynamic";
// UI hint only (shows/hides the Admin button). /admin enforces access on the server regardless.
export async function GET() {
  const p = await getProfile();
  return NextResponse.json({ role: p?.role ?? null }, { headers: { "Cache-Control": "no-store" } });
}
