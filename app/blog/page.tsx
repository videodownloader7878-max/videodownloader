import Link from "next/link";
import Header from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { getSupabase } from "@/lib/supabase";
export const metadata = { title: "Blog – MediaAura", description: "Tips, guides and news about video downloading and online tools." };
const PER = 9;
export default async function Blog({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const sb = getSupabase();
  const { data, count } = sb
    ? await sb.from("blog_posts").select("id,slug,title,excerpt,featured_image,published_at,categories(name)", { count: "exact" })
        .in("status", ["published", "scheduled"]).lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false }).range((page - 1) * PER, page * PER - 1)
    : { data: null, count: 0 };
  const posts = (data ?? []) as any[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER));
  return (<><Header /><main className="wrap toolpage" style={{ maxWidth: 1120 }}><h1>Blog</h1><p className="lead" style={{ maxWidth: "60ch" }}>Tips, guides and news about video downloading and online tools.</p>
    {posts.length === 0 ? <div className="card"><h3>No articles yet</h3><p style={{ margin: 0 }}>Published articles will appear here.</p></div> : <div className="postgrid">{posts.map((p) => (
      <Link key={p.id} href={`/blog/${p.slug}`} className="pcard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.featured_image && <img src={p.featured_image} alt="" />}
        <small style={{ color: "var(--mut)" }}>{p.categories?.name}</small><h3>{p.title}</h3><p>{p.excerpt}</p>
      </Link>))}</div>}
    {pages > 1 && <div className="pager">{page > 1 ? <Link className="btn" href={`/blog?page=${page - 1}`}>← Newer</Link> : <span />}{page < pages && <Link className="btn" href={`/blog?page=${page + 1}`}>Older →</Link>}</div>}
  </main><Footer /></>);
}
