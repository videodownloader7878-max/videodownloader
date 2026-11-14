import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import ToolClient from "@/components/ToolClient";
import Mp3Converter from "@/components/Mp3Converter";
import { tools } from "@/lib/tools";
import { adapters } from "@/lib/adapters";
import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/sanitize";
import AdSlot from "@/components/AdSlot";
export const revalidate = 60;
export const generateStaticParams = () => tools.map((t) => ({ slug: t.slug }));
type Seo = Record<string, any> | null;
const seoFor = async (scope: string, id: string): Promise<Seo> => {
  const sb = getSupabase();
  return sb ? (await sb.from("seo_settings").select("*").eq("scope", scope).eq("ref_id", id).maybeSingle()).data ?? null : null;
};
// Tool pages: static config + DB overrides. A missing DB row means the admin disabled the tool (RLS hides it).
const loadTool = cache(async (slug: string) => {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) return null;
  const sb = getSupabase();
  if (!sb) return { tool, row: null, seo: null as Seo };
  const { data, error } = await sb.from("tools").select("id,name,description,page_content").eq("slug", slug).maybeSingle();
  if (!error && !data) return null;
  return { tool, row: data, seo: data ? await seoFor("tool", data.id) : null };
});
// CMS pages (About, Privacy, custom landing pages): published only.
const loadPage = cache(async (slug: string) => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("pages").select("id,title,content,updated_at").eq("slug", slug).eq("status", "published").maybeSingle();
  return data ? { page: data, seo: await seoFor("page", data.id) } : null;
});
const robots = (s: Seo) => ({ index: s?.robots_index ?? true, follow: s?.robots_follow ?? true });
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const t = await loadTool(params.slug);
  if (t) {
    const name = t.row?.name ?? t.tool.name;
    const description = t.seo?.meta_description ?? t.row?.description ?? `${name}: check a link, see what the platform allows and find official alternatives.`;
    return { title: t.seo?.seo_title ?? `${name} – MediaAura`, description, alternates: t.seo?.canonical_url ? { canonical: t.seo.canonical_url } : undefined, robots: robots(t.seo),
      openGraph: { title: t.seo?.og_title ?? name, description: t.seo?.og_description ?? description, images: t.seo?.og_image ? [t.seo.og_image] : undefined } };
  }
  const p = await loadPage(params.slug);
  if (!p) return {};
  return { title: p.seo?.seo_title ?? `${p.page.title} – MediaAura`, description: p.seo?.meta_description ?? undefined, alternates: p.seo?.canonical_url ? { canonical: p.seo.canonical_url } : undefined, robots: robots(p.seo),
    openGraph: { title: p.seo?.og_title ?? p.page.title, description: p.seo?.og_description ?? undefined, images: p.seo?.og_image ? [p.seo.og_image] : undefined } };
}
export default async function Slug({ params }: { params: { slug: string } }) {
  const t = await loadTool(params.slug);
  if (t) {
    const name = t.row?.name ?? t.tool.name;
    const isMp3 = t.tool.slug === "video-to-mp3";
    const desc = t.row?.description ?? (isMp3 ? "Convert your own video or audio files to MP3 right in your browser." : `Paste a ${adapters[t.tool.slug].platform} link to check it and see what the platform officially allows.`);
    return (<><Header /><main className="wrap toolpage"><h1>{name}</h1><p className="lead">{desc}</p>
      {isMp3 ? <Mp3Converter /> : <ToolClient slug={t.tool.slug} platform={adapters[t.tool.slug].platform} />}
      <AdSlot placement="tool_page" />
      {t.row?.page_content?.split(/\n{2,}/).map((p, i) => <p key={i} style={{ color: "var(--mut)", fontSize: 14 }}>{p}</p>)}
    </main><Footer /></>);
  }
  const p = await loadPage(params.slug);
  if (!p) notFound();
  return (<><Header /><main className="wrap toolpage"><h1>{p.page.title}</h1>
    <div className="prose" dangerouslySetInnerHTML={{ __html: clean(p.page.content) }} />
    <p style={{ color: "var(--mut)", fontSize: 13 }}>Last updated {new Date(p.page.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
  </main><Footer /></>);
}
