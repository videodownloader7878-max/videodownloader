import Link from "next/link";
import { requireRole, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/admin/ui";
import { getSetting, SEO_DEFAULTS } from "@/lib/settings";
import { saveSeoGlobal } from "../actions2";
type Item = { key: string; type: string; title: string; edit: string; url: string; seo: Record<string, any> | null; content: string };
export default async function SeoPage({ searchParams: sp }: { searchParams: { error?: string; ok?: string } }) {
  const me = await requireRole("editor"); const sb = createClient();
  const [posts, pages, tools, seos, g] = await Promise.all([
    sb.from("blog_posts").select("id,slug,title,status,content").limit(1000), sb.from("pages").select("id,slug,title,status,content").limit(500),
    sb.from("tools").select("id,slug,name,is_enabled").limit(50), sb.from("seo_settings").select("*").in("scope", ["post", "page", "tool"]).limit(2000), getSetting("seo", SEO_DEFAULTS)]);
  const by = new Map((seos.data ?? []).map((s) => [`${s.scope}:${s.ref_id}`, s]));
  const items: Item[] = [
    ...(posts.data ?? []).filter((p) => ["published", "scheduled"].includes(p.status)).map((p) => ({ key: `post:${p.id}`, type: "Article", title: p.title, edit: `/admin/blog/${p.id}`, url: `/blog/${p.slug}`, seo: by.get(`post:${p.id}`) ?? null, content: p.content })),
    ...(pages.data ?? []).filter((p) => p.status === "published").map((p) => ({ key: `page:${p.id}`, type: "Page", title: p.title, edit: `/admin/pages/${p.id}`, url: `/${p.slug}`, seo: by.get(`page:${p.id}`) ?? null, content: p.content })),
    ...(tools.data ?? []).filter((t) => t.is_enabled).map((t) => ({ key: `tool:${t.id}`, type: "Tool", title: t.name, edit: `/admin/tools/${t.slug}`, url: `/${t.slug}`, seo: by.get(`tool:${t.id}`) ?? null, content: "" })),
  ];
  const count = (f: (i: Item) => string | undefined) => { const m = new Map<string, number>(); items.forEach((i) => { const v = f(i)?.trim().toLowerCase(); if (v) m.set(v, (m.get(v) ?? 0) + 1); }); return m; };
  const dt = count((i) => i.seo?.seo_title), dd = count((i) => i.seo?.meta_description);
  const known = new Set(["/", "/blog", "/contact", ...items.map((i) => i.url)]);
  const broken: { from: Item; href: string }[] = [];
  items.forEach((i) => { for (const m of i.content.matchAll(/href="(\/[^"#?]*)/g)) { const h = m[1].replace(/\/$/, "") || "/"; if (!known.has(h) && !h.startsWith("/api")) broken.push({ from: i, href: h }); } });
  const rows = items.map((i) => { const s = i.seo; const issues: string[] = [];
    if (!s?.seo_title) issues.push("Missing SEO title"); if (!s?.meta_description) issues.push("Missing meta description");
    if (s?.seo_title && (dt.get(s.seo_title.trim().toLowerCase()) ?? 0) > 1) issues.push("Duplicate title"); if (s?.meta_description && (dd.get(s.meta_description.trim().toLowerCase()) ?? 0) > 1) issues.push("Duplicate description");
    if (!s?.canonical_url) issues.push("No canonical URL"); if (s?.robots_index === false) issues.push("Noindex");
    if (/<h1[\s>]/i.test(i.content)) issues.push("Extra H1 in content"); return { i, issues, inSitemap: s?.robots_index !== false }; });
  const n = (t: string) => rows.filter((r) => r.issues.includes(t)).length;
  const cards: [string, number][] = [["Missing SEO titles", n("Missing SEO title")], ["Missing meta descriptions", n("Missing meta description")], ["Duplicate titles", n("Duplicate title")], ["Duplicate descriptions", n("Duplicate description")], ["Missing canonical URLs", n("No canonical URL")], ["Noindex pages", n("Noindex")], ["Broken internal links", broken.length], ["Missing H1", 0]];
  return (<><h1>SEO Management</h1><Flash error={sp.error} ok={sp.ok} />
    <h2 style={{ fontSize: 18 }}>Overview</h2><div className="a-stats">{cards.map(([l, v]) => <div key={l} className="a-card a-stat"><span>{l}</span><b>{v}</b></div>)}</div>
    <p className="a-muted">Checks run on published content only. Every page template renders its title as the H1, so “Missing H1” is always 0. This is an on-site audit: it doesn’t show Google rankings or Search Console data.</p>
    <div className="a-card a-scroll" style={{ margin: "14px 0" }}>{rows.length === 0 ? <p className="a-muted">No published pages yet.</p> : <table className="tbl"><thead><tr><th>Item</th><th>Type</th><th>Issues</th><th>In sitemap</th><th /></tr></thead><tbody>
      {rows.map(({ i, issues, inSitemap }) => <tr key={i.key}><td><b>{i.title}</b><br /><small className="a-muted">{i.url}</small></td><td>{i.type}</td><td>{issues.length ? issues.map((x) => <span key={x} className="a-tag y" style={{ marginRight: 4 }}>{x}</span>) : <span className="a-tag g">OK</span>}</td><td>{inSitemap ? "Yes" : "No"}</td><td><Link className="a-btn" href={i.edit}>Edit SEO</Link></td></tr>)}</tbody></table>}</div>
    {broken.length > 0 && <div className="a-card" style={{ marginBottom: 14 }}><h3>Broken internal links</h3><ul className="a-list">{broken.slice(0, 50).map((b, k) => <li key={k}><span>{b.href}</span><small>in {b.from.title}</small></li>)}</ul></div>}
    {hasRole(me, "admin") ? <form action={saveSeoGlobal} className="a-form a-card"><h3>Global SEO settings</h3>
      {([["site_title", "Website title"], ["meta_description", "Global meta description"], ["default_og_image", "Default Open Graph image URL (https)"], ["social_title", "Default social title"], ["social_description", "Default social description"], ["canonical_domain", "Canonical domain (https://example.com)"], ["org_name", "Organization name"], ["org_logo", "Organization logo URL (https)"], ["org_email", "Organization email"], ["ga_id", "Google Analytics ID (G-XXXXXXXXXX)"], ["gsc_verification", "Google Search Console verification code"]] as [keyof typeof SEO_DEFAULTS, string][]).map(([k, l]) => <label key={k}>{l}<input type="text" name={k} defaultValue={String(g[k])} /></label>)}
      <label>Social profiles (one https URL per line)<textarea name="social_profiles" rows={3} defaultValue={g.social_profiles} /></label>
      <label>Other verification tags (one per line: name=content)<textarea name="other_verification" rows={2} defaultValue={g.other_verification} /></label>
      <label className="chk"><input type="checkbox" name="robots_noindex" defaultChecked={g.robots_noindex} />Ask search engines not to index the whole site (e.g. while testing)</label>
      <p className="a-muted">Sitemap is generated automatically at /sitemap.xml and robots at /robots.txt. Per-page SEO is edited in each article, page and tool.</p>
      <div><button className="a-btn p">Save global SEO</button></div></form> : <p className="a-muted">Global SEO settings are available to administrators.</p>}</>);
}
