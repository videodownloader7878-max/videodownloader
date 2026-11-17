import { NextResponse } from "next/server";
import { clientIp, visitorHash } from "@/lib/request";
import { limited } from "@/lib/rateLimit";
import { sameOrigin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(req: Request) {
  if (!sameOrigin(req) || limited(clientIp(req) + "t", 60)) return new NextResponse(null, { status: 204 });
  try {
    const b = await req.json();
    const path = typeof b.path === "string" && b.path.startsWith("/") && b.path.length < 300 && !b.path.startsWith("/admin") ? b.path : null;
    if (b.type === "page_view" && path) await createAdminClient().from("usage_events").insert({ event_type: "page_view", path, visitor_hash: visitorHash(req) });
    else if (b.type === "article_view" && typeof b.postId === "string" && UUID.test(b.postId)) await createAdminClient().from("usage_events").insert({ event_type: "article_view", post_id: b.postId, path, visitor_hash: visitorHash(req) });
  } catch { /* analytics must never break the site */ }
  return new NextResponse(null, { status: 204 });
}
