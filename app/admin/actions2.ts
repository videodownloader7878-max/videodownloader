"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorize } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/audit";
import { clean } from "@/lib/sanitize";
import { HOME_DEFAULTS, SEO_DEFAULTS, GENERAL_DEFAULTS } from "@/lib/settings";
import { EMAIL_RE } from "@/lib/request";
type State = { error?: string };
type Sb = ReturnType<typeof createClient>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enc = encodeURIComponent;
async function guard(min: "admin" | "editor") { const me = await authorize(min); if (!me) redirect("/"); return me; }
const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const https = (s: string) => { if (!s) return null; try { const u = new URL(s); return u.protocol === "https:" ? u.href : undefined; } catch { return undefined; } };
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
const when = (f: FormData, k: string) => { const v = text(f, k, 20); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null; const off = parseInt(text(f, "tz_offset", 6), 10) || 0; return new Date(Date.parse(v + ":00Z") + off * 60000).toISOString(); };
function seoFrom(f: FormData, scope: string) {
  const canonical = https(text(f, "canonical_url", 300)), og = https(text(f, "og_image", 300));
  if (canonical === undefined || og === undefined) return null;
  const t = text(f, "schema_type", 20);
  return { scope, seo_title: text(f, "seo_title", 120) || null, meta_description: text(f, "meta_description", 300) || null, target_keyword: text(f, "target_keyword", 100) || null,
    secondary_keywords: text(f, "secondary_keywords", 400).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10), canonical_url: canonical, robots_index: f.get("robots_index") === "on", robots_follow: f.get("robots_follow") === "on",
    og_title: text(f, "og_title", 120) || null, og_description: text(f, "og_description", 300) || null, og_image: og, schema_json: ["Article", "BlogPosting", "NewsArticle", "none"].includes(t) ? { type: t } : null };
}
async function saveSeo(sb: Sb, seo: NonNullable<ReturnType<typeof seoFrom>> & { ref_id: string }) {
  const { data: ex } = await sb.from("seo_settings").select("id").eq("scope", seo.scope).eq("ref_id", seo.ref_id).maybeSingle();
  return ex ? sb.from("seo_settings").update(seo).eq("id", ex.id) : sb.from("seo_settings").insert(seo);
}
async function saveSetting(sb: Sb, key: string, value: object, by: string) { return sb.from("site_settings").upsert({ key, value, is_public: true, updated_by: by }, { onConflict: "key" }); }

export async function savePost(id: string, _p: State, f: FormData): Promise<State> {
  const me = await guard("editor"); const sb = createClient(); const isNew = id === "new";
  if (!isNew && !UUID.test(id)) return { error: "Invalid article." };
  const title = text(f, "title", 200); if (!title) return { error: "Title is required." };
  const slug = text(f, "slug", 100).toLowerCase() || slugify(title);
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return { error: "Enter a URL slug using lowercase letters, numbers and hyphens." };
  const status = text(f, "status", 12); if (!["draft", "scheduled", "published", "archived"].includes(status)) return { error: "Invalid status." };
  const img = https(text(f, "featured_image", 500)); if (img === undefined) return { error: "Featured image must be an https:// URL." };
  const seo = seoFrom(f, "post"); if (!seo) return { error: "SEO URLs must start with https://" };
  let existing: { published_at: string | null; author_id: string | null } | null = null;
  if (!isNew) { const { data } = await sb.from("blog_posts").select("published_at,author_id").eq("id", id).maybeSingle(); if (!data) return { error: "Article not found." }; existing = data; }
  let published_at = existing?.published_at ?? null; const scheduled = when(f, "scheduled_at");
  if (status === "scheduled") { if (!scheduled || Date.parse(scheduled) <= Date.now()) return { error: "Choose a future date and time to schedule." }; published_at = scheduled; }
  else if (status === "published") published_at = when(f, "published_at") ?? published_at ?? new Date().toISOString();
  let category_id: string | null = UUID.test(text(f, "category_id", 40)) ? text(f, "category_id", 40) : null;
  const newCat = text(f, "category_new", 60);
  if (newCat && slugify(newCat)) { const { data: c, error } = await sb.from("categories").upsert({ slug: slugify(newCat), name: newCat }, { onConflict: "slug" }).select("id").single(); if (error) return { error: error.message }; category_id = c.id; }
  let author_id = existing?.author_id ?? me.id; const a = text(f, "author_id", 40); if (me.role !== "editor" && UUID.test(a)) author_id = a;
  const content = clean(text(f, "content", 200000)); const words = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  const faq = text(f, "faq", 5000).split("\n").map((l) => l.split("|")).filter((p) => p.length >= 2).map((p) => ({ q: p[0].trim(), a: p.slice(1).join("|").trim() })).filter((x) => x.q && x.a).slice(0, 20);
  const row = { title, slug, excerpt: text(f, "excerpt", 400) || null, content, featured_image: img, category_id, author_id, status, is_featured: f.get("is_featured") === "on", scheduled_at: status === "scheduled" ? scheduled : null, published_at, faq, word_count: words, reading_time: words ? Math.max(1, Math.ceil(words / 200)) : 0 };
  const res = isNew ? await sb.from("blog_posts").insert(row).select("id").single() : await sb.from("blog_posts").update(row).eq("id", id).select("id").single();
  if (res.error) return { error: res.error.message.includes("duplicate") ? "That slug is already used by another article." : res.error.message };
  const postId = res.data.id as string;
  const tagRows = [...new Set(text(f, "tags", 400).split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 15).map((n) => ({ slug: slugify(n), name: n })).filter((t) => t.slug);
  await sb.from("blog_post_tags").delete().eq("post_id", postId);
  if (tagRows.length) { const { data: tg } = await sb.from("tags").upsert(tagRows, { onConflict: "slug" }).select("id"); if (tg?.length) await sb.from("blog_post_tags").insert(tg.map((t) => ({ post_id: postId, tag_id: t.id }))); }
  const sr = await saveSeo(sb, { ...seo, ref_id: postId }); if (sr.error) return { error: sr.error.message };
  await logActivity(sb, me.id, isNew ? "article_create" : "article_update", "post", postId, { status, slug });
  await logActivity(sb, me.id, "seo_update", "post", postId);
  revalidatePath("/"); revalidatePath("/blog"); revalidatePath(`/blog/${slug}`); revalidatePath("/sitemap.xml");
  redirect(`/admin/blog/${postId}?ok=Saved`);
}
export async function setPostStatus(id: string, status: string) {
  const me = await guard("editor");
  if (!UUID.test(id) || !["draft", "published"].includes(status)) redirect("/admin/blog?error=Invalid+input");
  const sb = createClient(); const { data: p } = await sb.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
  const { error } = await sb.from("blog_posts").update({ status, published_at: status === "published" ? p?.published_at ?? new Date().toISOString() : p?.published_at ?? null }).eq("id", id);
  if (error) redirect(`/admin/blog?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "article_update", "post", id, { status }); revalidatePath("/"); revalidatePath("/blog"); redirect(`/admin/blog?ok=${status === "published" ? "Published" : "Unpublished"}`);
}
export async function togglePostFeatured(id: string, v: boolean) {
  const me = await guard("editor");
  if (!UUID.test(id)) redirect("/admin/blog?error=Invalid+input");
  const sb = createClient(); const { error } = await sb.from("blog_posts").update({ is_featured: v }).eq("id", id);
  if (error) redirect(`/admin/blog?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "article_update", "post", id, { featured: v }); revalidatePath("/"); redirect("/admin/blog?ok=Updated");
}
export async function deletePost(id: string) {
  const me = await guard("admin");
  if (!UUID.test(id)) redirect("/admin/blog?error=Invalid+input");
  const sb = createClient(); const { error } = await sb.from("blog_posts").delete().eq("id", id);
  if (error) redirect(`/admin/blog?error=${enc(error.message)}`);
  await sb.from("seo_settings").delete().eq("scope", "post").eq("ref_id", id);
  await logActivity(sb, me.id, "article_delete", "post", id); revalidatePath("/"); revalidatePath("/blog"); revalidatePath("/sitemap.xml"); redirect("/admin/blog?ok=Article+deleted");
}
export async function savePage(id: string, _p: State, f: FormData): Promise<State> {
  const me = await guard("editor"); const sb = createClient(); const isNew = id === "new";
  if (!isNew && !UUID.test(id)) return { error: "Invalid page." };
  const title = text(f, "title", 200), slug = text(f, "slug", 100).toLowerCase(), status = text(f, "status", 10);
  if (!title) return { error: "Title is required." };
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return { error: "Slug may only contain lowercase letters, numbers and hyphens." };
  if (!["draft", "published"].includes(status)) return { error: "Invalid status." };
  const img = https(text(f, "featured_image", 500)); const seo = seoFrom(f, "page");
  if (img === undefined || !seo) return { error: "URLs must start with https://" };
  let prevPub: string | null = null;
  if (!isNew) { const { data } = await sb.from("pages").select("published_at").eq("id", id).maybeSingle(); if (!data) return { error: "Page not found." }; prevPub = data.published_at; }
  const row = { title, slug, content: clean(text(f, "content", 200000)), featured_image: img, status, published_at: status === "published" ? prevPub ?? new Date().toISOString() : prevPub, ...(isNew ? { created_by: me.id } : {}) };
  const res = isNew ? await sb.from("pages").insert(row).select("id").single() : await sb.from("pages").update(row).eq("id", id).select("id").single();
  if (res.error) return { error: res.error.message.includes("pages_slug_reserved") ? "That slug is reserved by the site. Choose another." : res.error.message.includes("duplicate") ? "That slug is already used." : res.error.message };
  const sr = await saveSeo(sb, { ...seo, ref_id: res.data.id }); if (sr.error) return { error: sr.error.message };
  await logActivity(sb, me.id, isNew ? "page_create" : "page_update", "page", res.data.id, { slug, status }); await logActivity(sb, me.id, "seo_update", "page", res.data.id);
  revalidatePath(`/${slug}`); revalidatePath("/sitemap.xml"); redirect(`/admin/pages/${res.data.id}?ok=Saved`);
}
export async function deletePage(id: string) {
  const me = await guard("admin");
  if (!UUID.test(id)) redirect("/admin/pages?error=Invalid+input");
  const sb = createClient(); const { error } = await sb.from("pages").delete().eq("id", id);
  if (error) redirect(`/admin/pages?error=${enc(error.message)}`);
  await sb.from("seo_settings").delete().eq("scope", "page").eq("ref_id", id);
  await logActivity(sb, me.id, "page_delete", "page", id); revalidatePath("/sitemap.xml"); redirect("/admin/pages?ok=Page+deleted");
}
const HOME_URLS = ["logo_url", "hero_image_url", "social_facebook", "social_youtube", "social_x", "social_instagram", "social_linkedin", "social_pinterest"];
export async function saveHome(f: FormData) {
  const me = await guard("editor"); const sb = createClient(); const v: Record<string, string | boolean> = {};
  for (const [k, d] of Object.entries(HOME_DEFAULTS)) {
    if (typeof d === "boolean") { v[k] = f.get(k) === "on"; continue; }
    const t = text(f, k, ["hero_description", "why_items", "footer_description", "articles_desc"].includes(k) ? 1000 : 300);
    if (HOME_URLS.includes(k)) { const u = https(t); if (u === undefined) redirect(`/admin/content?error=${enc(k + " must start with https://")}`); v[k] = u ?? ""; } else v[k] = t;
  }
  const { error } = await saveSetting(sb, "home", v, me.id);
  if (error) redirect(`/admin/content?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "homepage_update", "site_settings", "home"); revalidatePath("/", "layout"); redirect("/admin/content?ok=Saved");
}
export async function saveSeoGlobal(f: FormData) {
  const me = await guard("admin"); const sb = createClient(); const v: Record<string, string | boolean> = {};
  for (const [k, d] of Object.entries(SEO_DEFAULTS)) {
    if (typeof d === "boolean") { v[k] = f.get(k) === "on"; continue; }
    const t = text(f, k, ["social_profiles", "other_verification", "meta_description", "social_description"].includes(k) ? 1000 : 300);
    if (["default_og_image", "org_logo"].includes(k)) { const u = https(t); if (u === undefined) redirect(`/admin/seo?error=${enc(k + " must start with https://")}`); v[k] = u ?? ""; }
    else if (k === "canonical_domain") { const u = https(t); if (u === undefined) redirect("/admin/seo?error=Canonical+domain+must+start+with+https://"); v[k] = u ? new URL(u).origin : ""; }
    else if (k === "ga_id") { if (t && !/^G-[A-Z0-9]{4,14}$/.test(t)) redirect("/admin/seo?error=Google+Analytics+ID+looks+like+G-XXXXXXXXXX"); v[k] = t; }
    else v[k] = t;
  }
  const { error } = await saveSetting(sb, "seo", v, me.id);
  if (error) redirect(`/admin/seo?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "seo_update", "site_settings", "seo"); revalidatePath("/", "layout"); redirect("/admin/seo?ok=Saved");
}
export async function saveGeneral(f: FormData) {
  const me = await guard("admin"); const sb = createClient(); const email = text(f, "support_email", 254);
  if (email && !EMAIL_RE.test(email)) redirect("/admin/settings?error=Enter+a+valid+support+email");
  const v = { ...GENERAL_DEFAULTS, support_email: email, registration_enabled: f.get("registration_enabled") === "on", contact_enabled: f.get("contact_enabled") === "on", newsletter_enabled: f.get("newsletter_enabled") === "on" };
  const { error } = await saveSetting(sb, "general", v, me.id);
  if (error) redirect(`/admin/settings?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "settings_update", "site_settings", "general", v); revalidatePath("/", "layout"); redirect("/admin/settings?ok=Saved");
}
export async function saveAd(placement: string, f: FormData) {
  const me = await guard("admin");
  if (!["homepage", "tool_page", "blog", "sidebar", "footer"].includes(placement)) redirect("/admin/ads?error=Invalid+placement");
  const provider = text(f, "provider", 10), enabled = f.get("is_enabled") === "on"; const config: Record<string, string> = {};
  if (provider === "adsense") {
    config.adsense_client = text(f, "adsense_client", 40); config.adsense_slot = text(f, "adsense_slot", 30);
    if (enabled && (!/^ca-pub-\d{10,20}$/.test(config.adsense_client) || !/^\d{5,20}$/.test(config.adsense_slot))) redirect("/admin/ads?error=AdSense+needs+a+valid+client+ID+(ca-pub-…)+and+slot+ID");
  } else if (provider === "custom") {
    const u = https(text(f, "script_src", 300)); const allowed = (process.env.ADS_ALLOWED_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
    if (u === undefined || (enabled && !u)) redirect("/admin/ads?error=Script+URL+must+start+with+https://");
    if (u && !allowed.includes(new URL(u).hostname)) redirect("/admin/ads?error=That+host+is+not+in+ADS_ALLOWED_HOSTS");
    config.script_src = u ?? "";
  } else if (enabled) redirect("/admin/ads?error=Choose+a+provider+before+enabling");
  const sb = createClient();
  const { error } = await sb.from("ad_settings").upsert({ placement, is_enabled: enabled, provider: provider === "none" ? null : provider, config }, { onConflict: "placement" });
  if (error) redirect(`/admin/ads?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "ads_update", "ad_settings", placement, { enabled, provider }); revalidatePath("/", "layout"); redirect("/admin/ads?ok=Saved");
}
export async function saveProfileName(f: FormData) {
  const me = await guard("editor"); const sb = createClient();
  const { error } = await sb.from("profiles").update({ full_name: text(f, "full_name", 100) || null }).eq("id", me.id);
  if (error) redirect(`/admin/profile?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "profile_update", "profile", me.id); redirect("/admin/profile?ok=Saved");
}
export async function setSubscriberStatus(id: string, status: string) {
  const me = await guard("admin");
  if (!UUID.test(id) || !["subscribed", "unsubscribed"].includes(status)) redirect("/admin/newsletter?error=Invalid+input");
  const sb = createClient(); const { error } = await sb.from("newsletter_subscribers").update({ status }).eq("id", id);
  if (error) redirect(`/admin/newsletter?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "subscriber_status", "newsletter_subscriber", id, { status }); revalidatePath("/admin/newsletter"); redirect("/admin/newsletter?ok=Updated");
}
export async function deleteSubscriber(id: string) {
  const me = await guard("admin");
  if (!UUID.test(id)) redirect("/admin/newsletter?error=Invalid+input");
  const sb = createClient(); const { error } = await sb.from("newsletter_subscribers").delete().eq("id", id);
  if (error) redirect(`/admin/newsletter?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "subscriber_delete", "newsletter_subscriber", id); redirect("/admin/newsletter?ok=Subscriber+removed");
}
export async function updateMedia(id: string, f: FormData) {
  const me = await guard("editor"); const folder = text(f, "folder", 40).toLowerCase();
  if (!UUID.test(id) || !/^[a-z0-9-]{1,40}$/.test(folder)) redirect("/admin/media?error=Folder+may+only+use+letters,+numbers+and+hyphens");
  const sb = createClient(); const { error } = await sb.from("media_assets").update({ title: text(f, "title", 120) || null, alt_text: text(f, "alt_text", 200) || null, folder }).eq("id", id);
  if (error) redirect(`/admin/media?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "media_update", "media_asset", id); redirect("/admin/media?ok=Saved");
}
export async function deleteMedia(id: string) {
  const me = await guard("admin");
  if (!UUID.test(id)) redirect("/admin/media?error=Invalid+input");
  const sb = createClient(); const { data: m } = await sb.from("media_assets").select("storage_path").eq("id", id).maybeSingle();
  if (!m) redirect("/admin/media?error=File+not+found");
  await sb.storage.from("media").remove([m.storage_path]);
  const { error } = await sb.from("media_assets").delete().eq("id", id);
  if (error) redirect(`/admin/media?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "media_delete", "media_asset", id); redirect("/admin/media?ok=File+deleted");
}
// Reply by email through Resend (only when RESEND_API_KEY and RESEND_FROM are configured).
export async function sendReply(id: string, f: FormData) {
  const me = await guard("admin"); const back = `/admin/messages/${id}`;
  if (!UUID.test(id)) redirect("/admin/messages?error=Invalid+input");
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) redirect(`${back}?error=Email+service+is+not+configured`);
  const subject = text(f, "subject", 150).replace(/[\r\n]+/g, " "), body = text(f, "body", 5000);
  if (!subject || body.length < 2) redirect(`${back}?error=Write+a+subject+and+a+message`);
  const sb = createClient(); const { data: m } = await sb.from("contact_messages").select("email").eq("id", id).maybeSingle();
  if (!m) redirect("/admin/messages?error=Message+not+found");
  let ok = false;
  try { const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM, to: [m.email], subject, text: body }), signal: AbortSignal.timeout(10000) }); ok = r.ok; } catch {}
  if (!ok) redirect(`${back}?error=The+email+service+rejected+the+message`);
  await sb.from("contact_messages").update({ status: "replied" }).eq("id", id);
  await logActivity(sb, me.id, "message_reply", "contact_message", id); redirect(`${back}?ok=Reply+sent`);
}
