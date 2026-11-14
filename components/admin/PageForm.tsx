"use client";
import { useFormState } from "react-dom";
import EditorField, { type LinkTarget } from "@/components/admin/EditorField";
import SeoFields from "@/components/admin/SeoFields";
import type { MediaItem } from "@/lib/media";
type Props = { action: (prev: { error?: string }, f: FormData) => Promise<{ error?: string }>; page: Record<string, any>; seo: Record<string, any> | null; media: MediaItem[]; links: LinkTarget[] };
export default function PageForm({ action, page, seo, media, links }: Props) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="a-form a-card" style={{ maxWidth: 900 }}>
      {state.error && <p role="alert" className="a-flash a-err">{state.error}</p>}
      <label>Title<input type="text" name="title" required maxLength={200} defaultValue={page.title ?? ""} /></label>
      <label>URL slug<input type="text" name="slug" required maxLength={100} defaultValue={page.slug ?? ""} placeholder="about" /></label>
      <label>Featured image URL<input type="url" name="featured_image" defaultValue={page.featured_image ?? ""} placeholder="https://" /></label>
      <label>Status<select name="status" defaultValue={page.status ?? "draft"}><option value="draft">Draft</option><option value="published">Published</option></select></label>
      <label>Content</label><EditorField initialHtml={page.content ?? ""} media={media} links={links} />
      <h3>SEO</h3><SeoFields seo={seo} />
      <div><button className="a-btn p">Save page</button></div>
    </form>
  );
}
