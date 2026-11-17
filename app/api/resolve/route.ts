import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { adapters, validateUrl } from "@/lib/adapters";
import { limited } from "@/lib/rateLimit";
import { sameOrigin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  let body: { slug?: unknown; url?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const slug = typeof body.slug === "string" ? body.slug : "";
  const adapter = adapters[slug];
  const url = typeof body.url === "string" && body.url.length < 2048 ? validateUrl(slug, body.url) : null;
  if (!adapter) return NextResponse.json({ error: "Unknown tool." }, { status: 404 });
  if (!url) return NextResponse.json({ error: `Enter a full https:// link from ${adapter.platform}.` }, { status: 400 });

  // Tool state comes from the database. Metadata lookup only runs once the admin marks the integration "verified".
  let status = "not_configured";
  try {
    const sb = createAdminClient();
    const { data: tool } = await sb.from("tools").select("is_enabled,integration_status").eq("slug", slug).maybeSingle();
    if (tool && !tool.is_enabled) return NextResponse.json({ error: "This tool is currently disabled." }, { status: 404 });
    if (tool) status = tool.integration_status;
    const visitor = createHash("sha256").update(`${ip}|${req.headers.get("user-agent") ?? ""}|${new Date().toISOString().slice(0, 10)}|${process.env.HASH_SALT ?? ""}`).digest("hex").slice(0, 32);
    await sb.from("usage_events").insert({ event_type: "tool_use", tool_slug: slug, path: `/${slug}`, visitor_hash: visitor });
  } catch { /* usage tracking and status lookup are best-effort */ }

  let preview: { title: string; author: string | null; thumbnail: string | null } | null = null;
  if (status === "verified" && adapter.oembed) {
    try {
      // Only the fixed, documented endpoint is called; the user's URL is passed as a query value, never fetched directly.
      const r = await fetch(`${adapter.oembed}?format=json&url=${encodeURIComponent(url.href)}`, { signal: AbortSignal.timeout(5000), headers: { accept: "application/json" }, cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        const thumb = typeof j.thumbnail_url === "string" && j.thumbnail_url.startsWith("https://") ? j.thumbnail_url : null;
        if (typeof j.title === "string") preview = { title: j.title.slice(0, 200), author: typeof j.author_name === "string" ? j.author_name.slice(0, 100) : null, thumbnail: thumb };
      }
    } catch { /* preview is optional */ }
  }
  return NextResponse.json({ platform: adapter.platform, preview, limitation: adapter.limitation, alternatives: adapter.alternatives });
}
