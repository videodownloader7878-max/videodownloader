"use client";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import EditorField, { type LinkTarget } from "@/components/admin/EditorField";
import SeoFields from "@/components/admin/SeoFields";
import type { MediaItem } from "@/lib/media";
type Opt = { id: string; name: string };
type Props = { action: (prev: { error?: string }, f: FormData) => Promise<{ error?: string }>; post: Record<string, any>; seo: Record<string, any> | null; categories: Opt[]; tagsText: string; faqText: string; authors: Opt[]; media: MediaItem[]; links: LinkTarget[] };
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
export default function PostForm({ action, post, seo, categories, tagsText, faqText, authors, media, links }: Props) {
  const [state, formAction] = useFormState(action, {});
  const form = useRef<HTMLFormElement>(null);
  const [content, setContent] = useState<string>(post.content ?? "");
  const [featured, setFeatured] = useState<string>(post.featured_image ?? "");
  const [sched, setSched] = useState(""); const [pub, setPub] = useState(""); const [tz, setTz] = useState("0"); const [tick, setTick] = useState(0);
  useEffect(() => { setSched(toLocal(post.scheduled_at)); setPub(toLocal(post.published_at)); setTz(String(new Date().getTimezoneOffset())); }, [post.scheduled_at, post.published_at]);
  const fd = form.current ? new FormData(form.current) : null; void tick;
  const g = (k: string) => String(fd?.get(k) ?? "").trim();
  const plain = content.replace(/<[^>]*>/g, " "); const words = plain.split(/\s+/).filter(Boolean).length;
  const kw = g("target_keyword").toLowerCase(); const seoTitle = g("seo_title") || g("title"); const meta = g("meta_description");
  const first = plain.split(/\s+/).filter(Boolean).slice(0, 150).join(" ").toLowerCase();
  const imgs = content.match(/<img\b[^>]*>/gi) ?? [];
  const checks: [string, boolean][] = [
    ["Title is 30–65 characters", seoTitle.length >= 30 && seoTitle.length <= 65], ["Meta description is 70–160 characters", meta.length >= 70 && meta.length <= 160],
    ["Focus keyword set", !!kw], ["Keyword in title", !!kw && seoTitle.toLowerCase().includes(kw)], ["Keyword in meta description", !!kw && meta.toLowerCase().includes(kw)], ["Keyword in first 150 words", !!kw && first.includes(kw)],
    ["Slug or title present", !!(g("slug") || g("title"))], ["Featured image set", !!featured], ["At least 300 words", words >= 300], ["Has an H2 heading", /<h2/i.test(content)],
    ["Has an internal link", /href="\/(?!\/)/.test(content)], ["Every image has alt text", imgs.every((i) => /alt="[^"]+"/i.test(i))], ["Excerpt written", !!g("excerpt")], ["FAQ added", g("faq").includes("|")],
  ];
  const status = g("status") || post.status || "draft";
  return (
    <form ref={form} action={formAction} onInput={() => setTick((n) => n + 1)} className="a-form" style={{ maxWidth: "none" }}>
      {state.error && <p role="alert" className="a-flash a-err">{state.error}</p>}
      <div className="a-split">
        <div className="a-form">
          <label>Title<input type="text" name="title" required maxLength={200} defaultValue={post.title ?? ""} /></label>
          <label>URL slug (blank = from title)<input type="text" name="slug" maxLength={100} defaultValue={post.slug ?? ""} placeholder="my-article" /></label>
          <label>Excerpt<textarea name="excerpt" rows={2} maxLength={400} defaultValue={post.excerpt ?? ""} /></label>
          <label>Content</label>
          <EditorField initialHtml={post.content ?? ""} media={media} links={links} onChange={setContent} />
          <label>FAQs (one per line: Question | Answer)<textarea name="faq" rows={4} defaultValue={faqText} /></label>
          <div className="a-card"><h3>SEO</h3><div className="a-form"><SeoFields seo={seo} article /></div></div>
        </div>
        <div className="a-form">
          <div className="a-card a-form"><h3>Publish</h3>
            <label>Status<select name="status" defaultValue={post.status ?? "draft"}><option value="draft">Draft</option><option value="published">Publish</option><option value="scheduled">Schedule</option><option value="archived">Unpublish / archive</option></select></label>
            {status === "scheduled" && <label>Publish at<input type="datetime-local" name="scheduled_at" value={sched} onChange={(e) => setSched(e.target.value)} /></label>}
            {status === "published" && <label>Publication date (blank = now)<input type="datetime-local" name="published_at" value={pub} onChange={(e) => setPub(e.target.value)} /></label>}
            <input type="hidden" name="tz_offset" value={tz} />
            <label className="chk"><input type="checkbox" name="is_featured" defaultChecked={!!post.is_featured} />Featured article</label>
            {authors.length > 0 && <label>Author<select name="author_id" defaultValue={post.author_id ?? ""}>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
            <p className="a-muted">Updated date is set automatically on every save.</p>
            <button className="a-btn p">Save article</button></div>
          <div className="a-card a-form"><h3>Details</h3>
            <label>Category<select name="category_id" defaultValue={post.category_id ?? ""}><option value="">None</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>Or new category<input type="text" name="category_new" maxLength={60} /></label>
            <label>Tags (comma separated)<input type="text" name="tags" defaultValue={tagsText} /></label>
            <label>Featured image URL<input type="url" name="featured_image" value={featured} onChange={(e) => setFeatured(e.target.value)} placeholder="https://" /></label>
            {media.length > 0 && <select aria-label="Pick from media library" value="" onChange={(e) => { const m = media.find((x) => x.id === e.target.value); if (m) setFeatured(m.url); }}><option value="">Pick from media library…</option>{media.map((m) => <option key={m.id} value={m.id}>{m.title || m.alt || m.url.split("/").pop()}</option>)}</select>}</div>
          <div className="a-card"><h3>Writing stats</h3><p className="a-muted">{words} words · {words ? Math.max(1, Math.ceil(words / 200)) : 0} min read</p>
            <h3 style={{ marginTop: 12 }}>SEO checklist</h3><ul className="a-check">{checks.map(([l, ok]) => <li key={l} className={ok ? "ok" : "no"}>{l}</li>)}</ul></div>
        </div>
      </div>
    </form>
  );
}
