type Seo = Record<string, any> | null;
export default function SeoFields({ seo, article = false }: { seo: Seo; article?: boolean }) {
  return (<>
    <label>SEO title<input type="text" name="seo_title" maxLength={120} defaultValue={seo?.seo_title ?? ""} /></label>
    <label>Meta description<textarea name="meta_description" rows={2} maxLength={300} defaultValue={seo?.meta_description ?? ""} /></label>
    <label>Focus keyword<input type="text" name="target_keyword" maxLength={100} defaultValue={seo?.target_keyword ?? ""} /></label>
    <label>Secondary keywords (comma separated)<input type="text" name="secondary_keywords" defaultValue={(seo?.secondary_keywords ?? []).join(", ")} /></label>
    <label>Canonical URL<input type="url" name="canonical_url" defaultValue={seo?.canonical_url ?? ""} placeholder="https://" /></label>
    <label>Open Graph title<input type="text" name="og_title" maxLength={120} defaultValue={seo?.og_title ?? ""} /></label>
    <label>Open Graph description<textarea name="og_description" rows={2} maxLength={300} defaultValue={seo?.og_description ?? ""} /></label>
    <label>Social image URL<input type="url" name="og_image" defaultValue={seo?.og_image ?? ""} placeholder="https://" /></label>
    {article && <label>Schema type<select name="schema_type" defaultValue={seo?.schema_json?.type ?? "Article"}><option>Article</option><option>BlogPosting</option><option>NewsArticle</option><option value="none">None</option></select></label>}
    <label className="chk"><input type="checkbox" name="robots_index" defaultChecked={seo?.robots_index ?? true} />Allow indexing (uncheck for noindex)</label>
    <label className="chk"><input type="checkbox" name="robots_follow" defaultChecked={seo?.robots_follow ?? true} />Allow following links</label>
  </>);
}
