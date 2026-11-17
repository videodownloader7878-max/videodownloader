import type { MetadataRoute } from "next";
import { getSupabase } from "@/lib/supabase";
import { tools } from "@/lib/tools";
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const out: MetadataRoute.Sitemap = [{ url: base }, { url: `${base}/blog` }, { url: `${base}/contact` }];
  const sb = getSupabase();
  if (!sb) return [...out, ...tools.map((t) => ({ url: `${base}/${t.slug}` }))];
  const [tl, pg, ps, ni] = await Promise.all([
    sb.from("tools").select("id,slug"),
    sb.from("pages").select("id,slug,updated_at").eq("status", "published"),
    sb.from("blog_posts").select("id,slug,updated_at").in("status", ["published", "scheduled"]).lte("published_at", new Date().toISOString()),
    sb.from("seo_settings").select("ref_id").eq("robots_index", false),
  ]);
  const noindex = new Set((ni.data ?? []).map((r) => r.ref_id));
  const ok = (r: { id: string }) => !noindex.has(r.id);
  const toolRows = tl.error ? tools.map((t) => ({ id: t.slug, slug: t.slug })) : tl.data ?? [];
  return [...out,
    ...toolRows.filter(ok).map((t) => ({ url: `${base}/${t.slug}` })),
    ...(pg.data ?? []).filter(ok).map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updated_at })),
    ...(ps.data ?? []).filter(ok).map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updated_at }))];
}
