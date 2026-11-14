import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/admin/ui";
import { saveTool } from "../../actions";
export default async function EditTool({ params, searchParams: sp }: { params: { slug: string }; searchParams: { error?: string; ok?: string } }) {
  await requireRole("admin");
  const sb = createClient();
  const { data: t } = await sb.from("tools").select("*").eq("slug", params.slug).maybeSingle();
  if (!t) notFound();
  const { data: seo } = await sb.from("seo_settings").select("*").eq("scope", "tool").eq("ref_id", t.id).maybeSingle();
  return (<><p><Link href="/admin/tools">← All tools</Link></p><h1>{t.name}</h1><Flash error={sp.error} ok={sp.ok} />
    <form action={saveTool.bind(null, t.slug)} className="a-form a-card">
      <h3>Tool</h3>
      <label>Name<input type="text" name="name" defaultValue={t.name} required maxLength={80} /></label>
      <label>Description<textarea name="description" rows={2} maxLength={300} defaultValue={t.description ?? ""} /></label>
      <label>Icon (emoji or short text)<input type="text" name="icon" maxLength={8} defaultValue={t.icon ?? ""} /></label>
      <label>Page content (plain text, blank line between paragraphs)<textarea name="page_content" rows={6} maxLength={10000} defaultValue={t.page_content ?? ""} /></label>
      <label className="chk"><input type="checkbox" name="is_enabled" defaultChecked={t.is_enabled} />Page enabled</label>
      <label>Integration status<select name="integration_status" defaultValue={t.integration_status}><option value="not_configured">Not configured</option><option value="unverified">Unverified</option><option value="verified">Verified</option></select></label>
      <label className="chk"><input type="checkbox" name="confirm_verified" />I tested this integration and confirm it works (required to set “Verified”)</label>
      <p className="a-muted">Link metadata previews only run for tools marked Verified. Platform downloaders never download files.</p>
      <h3>SEO</h3>
      <label>SEO title<input type="text" name="seo_title" maxLength={120} defaultValue={seo?.seo_title ?? ""} /></label>
      <label>Meta description<textarea name="meta_description" rows={2} maxLength={300} defaultValue={seo?.meta_description ?? ""} /></label>
      <label>Target keyword<input type="text" name="target_keyword" maxLength={100} defaultValue={seo?.target_keyword ?? ""} /></label>
      <label>Secondary keywords (comma separated)<input type="text" name="secondary_keywords" defaultValue={(seo?.secondary_keywords ?? []).join(", ")} /></label>
      <label>Canonical URL<input type="url" name="canonical_url" defaultValue={seo?.canonical_url ?? ""} placeholder="https://" /></label>
      <label>Open Graph title<input type="text" name="og_title" maxLength={120} defaultValue={seo?.og_title ?? ""} /></label>
      <label>Open Graph description<textarea name="og_description" rows={2} maxLength={300} defaultValue={seo?.og_description ?? ""} /></label>
      <label>Open Graph image URL<input type="url" name="og_image" defaultValue={seo?.og_image ?? ""} placeholder="https://" /></label>
      <label className="chk"><input type="checkbox" name="robots_index" defaultChecked={seo?.robots_index ?? true} />Allow indexing</label>
      <label className="chk"><input type="checkbox" name="robots_follow" defaultChecked={seo?.robots_follow ?? true} />Allow following links</label>
      <div><button className="a-btn p">Save changes</button></div>
    </form></>);
}
