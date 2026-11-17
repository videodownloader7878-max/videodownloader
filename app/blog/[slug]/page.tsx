import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/SiteHeader";
import Footer from "@/components/SiteFooter";
import { ViewTracker } from "@/components/Tracker";
import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/sanitize";
import AdSlot from "@/components/AdSlot";
export const revalidate = 60;
const load = cache(async (slug: string) => {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("blog_posts")
    .select("id,slug,title,excerpt,content,featured_image,published_at,updated_at,faq,reading_time,categories(name),blog_post_tags(tags(name,slug))")
    .eq("slug", slug).in("status", ["published", "scheduled"]).lte("published_at", new Date().toISOString()).maybeSingle();
  if (!data) return null;
  const { data: seo } = await sb.from("seo_settings").select("*").eq("scope", "post").eq("ref_id", data.id).maybeSingle();
  return { post: data as any, seo: seo as Record<string, any> | null };
});
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const d = await load(params.slug);
  if (!d) return {};
  const { post, seo } = d;
  const description = seo?.meta_description ?? post.excerpt ?? undefined;
  return { title: seo?.seo_title ?? `${post.title} – MediaAura`, description, alternates: seo?.canonical_url ? { canonical: seo.canonical_url } : undefined,
    robots: { index: seo?.robots_index ?? true, follow: seo?.robots_follow ?? true },
    openGraph: { type: "article", title: seo?.og_title ?? post.title, description: seo?.og_description ?? description, images: seo?.og_image ?? post.featured_image ? [seo?.og_image ?? post.featured_image] : undefined, publishedTime: post.published_at, modifiedTime: post.updated_at } };
}
const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
export default async function Post({ params }: { params: { slug: string } }) {
  const d = await load(params.slug);
  if (!d) notFound();
  const { post, seo } = d;
  const faq: { q: string; a: string }[] = Array.isArray(post.faq) ? post.faq.filter((f: any) => f?.q && f?.a) : [];
  const stype = seo?.schema_json?.type ?? "Article";
  const ld: any[] = stype === "none" ? [] : [{ "@context": "https://schema.org", "@type": stype, headline: post.title, datePublished: post.published_at, dateModified: post.updated_at, image: post.featured_image ?? undefined, description: post.excerpt ?? undefined }];
  if (faq.length) ld.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  return (<><Header /><ViewTracker postId={post.id} />
    <main className="wrap toolpage" style={{ maxWidth: 780 }}>
      <Link href="/blog" style={{ color: "var(--mut)", fontSize: 14 }}>← All articles</Link>
      <small style={{ display: "block", color: "var(--mut)", marginTop: 14 }}>{post.categories?.name}</small>
      <h1>{post.title}</h1>
      <p style={{ color: "var(--mut)", fontSize: 13 }}>{fmt(post.published_at)}{post.reading_time ? ` · ${post.reading_time} min read` : ""}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {post.featured_image && <img src={post.featured_image} alt="" style={{ width: "100%", borderRadius: 16, margin: "8px 0 20px" }} />}
      <div className="prose" dangerouslySetInnerHTML={{ __html: clean(post.content) }} />
      <AdSlot placement="blog" />
      {faq.length > 0 && <section className="prose"><h2>Frequently asked questions</h2>{faq.map((f, i) => <details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>}
      {post.blog_post_tags?.length > 0 && <p style={{ color: "var(--mut)", fontSize: 13 }}>Tags: {post.blog_post_tags.map((t: any) => t.tags?.name).filter(Boolean).join(", ")}</p>}
      <AdSlot placement="sidebar" />
      {ld.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
    </main><Footer /></>);
}
