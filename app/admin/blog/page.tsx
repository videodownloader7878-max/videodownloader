import Link from "next/link";
import { requireRole, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash, Pager } from "@/components/admin/ui";
import { qs, fmtDate, safeSearch, pageNum } from "@/lib/adminUi";
import { setPostStatus, togglePostFeatured, deletePost } from "../actions2";
const PER = 20; const STATUSES = ["draft", "scheduled", "published", "archived"];
type SP = { status?: string; q?: string; page?: string; error?: string; ok?: string };
export default async function Blog({ searchParams: sp }: { searchParams: SP }) {
  const me = await requireRole("editor");
  const page = pageNum(sp.page), s = safeSearch(sp.q);
  let q = createClient().from("blog_posts").select("id,title,slug,status,is_featured,published_at,updated_at,categories(name)", { count: "exact" }).order("updated_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  if (sp.status && STATUSES.includes(sp.status)) q = q.eq("status", sp.status);
  if (s) q = q.ilike("title", `%${s}%`);
  const { data, count, error } = await q; const base = { status: sp.status, q: s };
  return (<><h1>Blog Management</h1><Flash error={sp.error ?? error?.message} ok={sp.ok} />
    <div className="a-tabs">{[["", "All"], ...STATUSES.map((x) => [x, x[0].toUpperCase() + x.slice(1)])].map(([v, l]) => <Link key={l} className={`a-btn ${(sp.status ?? "") === v ? "on" : ""}`} href={`/admin/blog${qs(base, { status: v, page: undefined })}`}>{l}</Link>)}
      <Link className="a-btn p" href="/admin/blog/new">+ New article</Link></div>
    <form className="a-filters"><input name="q" defaultValue={s} placeholder="Search titles" aria-label="Search" />{sp.status && <input type="hidden" name="status" value={sp.status} />}<button className="a-btn p">Search</button></form>
    <div className="a-card a-scroll">{(data ?? []).length === 0 ? <p className="a-muted">No articles yet. Create your first one.</p> : <table className="tbl"><thead><tr><th>Title</th><th>Status</th><th>Category</th><th>Published</th><th>Updated</th><th>Actions</th></tr></thead><tbody>
      {data!.map((p: any) => <tr key={p.id}><td><Link href={`/admin/blog/${p.id}`}><b>{p.title}</b></Link>{p.is_featured && <span className="a-tag y" style={{ marginLeft: 6 }}>featured</span>}<br /><small className="a-muted">/blog/{p.slug}</small></td>
        <td><span className={`a-tag ${p.status === "published" ? "g" : p.status === "scheduled" ? "y" : ""}`}>{p.status}</span></td><td>{p.categories?.name ?? "—"}</td><td>{fmtDate(p.published_at)}</td><td>{fmtDate(p.updated_at)}</td>
        <td><div className="a-inline" style={{ flexWrap: "wrap" }}>
          {p.status === "published" ? <form action={setPostStatus.bind(null, p.id, "draft")}><button className="a-btn">Unpublish</button></form> : <form action={setPostStatus.bind(null, p.id, "published")}><button className="a-btn">Publish</button></form>}
          <form action={togglePostFeatured.bind(null, p.id, !p.is_featured)}><button className="a-btn">{p.is_featured ? "Unfeature" : "Feature"}</button></form>
          {hasRole(me, "admin") && <details><summary className="a-btn d">Delete</summary><form action={deletePost.bind(null, p.id)}><button className="a-btn d">Confirm delete</button></form></details>}</div></td></tr>)}</tbody></table>}</div>
    <Pager page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PER))} href={(p) => `/admin/blog${qs(base, { page: String(p) })}`} /></>);
}
