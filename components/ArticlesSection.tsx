import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
type Post = { id: string; slug: string; title: string; excerpt: string | null; featured_image: string | null; published_at: string | null; is_featured: boolean; categories: { name: string } | null };
// Column names must match the blog_posts migration (next phase).
async function getPosts(): Promise<Post[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("blog_posts")
    .select("id,slug,title,excerpt,featured_image,published_at,is_featured,categories(name)")
    .in("status", ["published", "scheduled"]).lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false }).limit(8);
  return error || !data ? [] : (data as unknown as Post[]);
}
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
export default async function ArticlesSection({ badge = "Latest Articles", title = "Tips, Guides & Latest News", desc = "Get helpful articles, tutorials and updates about video downloading and online tools." }: { badge?: string; title?: string; desc?: string }) {
  const posts = await getPosts();
  const feat = posts.find((p) => p.is_featured) ?? posts[0];
  const recent = posts.filter((p) => p !== feat).slice(0, 3);
  return (
    <section className="arts" id="articles" aria-labelledby="ah">
      <div className="top"><div><span className="badge" style={{ background: "#e8e6ff", borderColor: "#cfc9ff", color: "#5a3cd8" }}>{badge}</span>
        <h2 id="ah">{title}</h2><p>{desc}</p></div>
        <Link className="btn" href="/blog">View All Articles →</Link></div>
      {!feat ? (
        <div className="empty"><b>No articles published yet</b><p>Articles you publish from the admin dashboard will appear here automatically.</p></div>
      ) : (
        <div className="artgrid">
          <Link href={`/blog/${feat.slug}`} className="feat">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {feat.featured_image && <img src={feat.featured_image} alt="" />}
            <div><small>{feat.categories?.name}</small><h3>{feat.title}</h3><p>{feat.excerpt}</p><small>{fmt(feat.published_at)} · Read More →</small></div>
          </Link>
          <div className="minis">{recent.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="mini">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.featured_image && <img src={p.featured_image} alt="" />}
              <div><b>{p.title}</b><small>{fmt(p.published_at)}</small></div>
            </Link>))}</div>
        </div>
      )}
    </section>
  );
}
