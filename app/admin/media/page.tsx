import { requireRole, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash, Pager } from "@/components/admin/ui";
import { qs, safeSearch, pageNum } from "@/lib/adminUi";
import { updateMedia, deleteMedia } from "../actions2";
const PER = 24;
export default async function Media({ searchParams: sp }: { searchParams: { q?: string; folder?: string; page?: string; error?: string; ok?: string } }) {
  const me = await requireRole("editor"); const sb = createClient();
  const page = pageNum(sp.page), s = safeSearch(sp.q), folder = /^[a-z0-9-]{1,40}$/.test(sp.folder ?? "") ? sp.folder : undefined;
  let q = sb.from("media_assets").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  if (folder) q = q.eq("folder", folder); if (s) q = q.or(`title.ilike.%${s}%,alt_text.ilike.%${s}%`);
  const [{ data, count, error }, folders] = await Promise.all([q, sb.from("media_assets").select("folder").limit(2000)]);
  const fl = [...new Set((folders.data ?? []).map((f) => f.folder))].sort(); const base = { q: s, folder };
  return (<><h1>Media Library</h1><Flash error={sp.error ?? error?.message} ok={sp.ok} />
    <form method="post" action="/api/admin/media" encType="multipart/form-data" className="a-form a-card" style={{ marginBottom: 14 }}><h3>Upload image</h3>
      <label>Image (PNG, JPEG, GIF or WebP, max 4 MB)<input type="file" name="file" accept="image/png,image/jpeg,image/gif,image/webp" required /></label>
      <label>Title<input type="text" name="title" maxLength={120} /></label><label>Alt text<input type="text" name="alt_text" maxLength={200} /></label>
      <label>Folder<input type="text" name="folder" defaultValue="general" list="folders" maxLength={40} /></label><datalist id="folders">{fl.map((f) => <option key={f} value={f} />)}</datalist>
      <div><button className="a-btn p">Upload</button></div></form>
    <form className="a-filters"><input name="q" defaultValue={s} placeholder="Search title or alt text" aria-label="Search" /><select name="folder" defaultValue={folder ?? ""} aria-label="Folder"><option value="">All folders</option>{fl.map((f) => <option key={f}>{f}</option>)}</select><button className="a-btn p">Filter</button></form>
    {(data ?? []).length === 0 ? <div className="a-card"><p className="a-muted">No images yet.</p></div> : <div className="a-media">{data!.map((m) => { const url = sb.storage.from("media").getPublicUrl(m.storage_path).data.publicUrl; return (
      <div key={m.id} className="a-card a-form">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt={m.alt_text ?? ""} loading="lazy" />
        <input type="text" readOnly value={url} aria-label="Image URL" style={{ padding: 6, fontSize: 12, border: "1px solid #e3e7f3", borderRadius: 8 }} />
        <form action={updateMedia.bind(null, m.id)} className="a-form"><label>Title<input type="text" name="title" defaultValue={m.title ?? ""} maxLength={120} /></label><label>Alt text<input type="text" name="alt_text" defaultValue={m.alt_text ?? ""} maxLength={200} /></label><label>Folder<input type="text" name="folder" defaultValue={m.folder} maxLength={40} /></label><div><button className="a-btn">Save</button></div></form>
        <details><summary className="a-btn">Replace image</summary><form method="post" action="/api/admin/media" encType="multipart/form-data" className="a-form"><input type="hidden" name="id" value={m.id} /><input type="file" name="file" accept={m.mime_type} required /><div><button className="a-btn p">Replace</button></div></form></details>
        {hasRole(me, "admin") && <details><summary className="a-btn d">Delete</summary><form action={deleteMedia.bind(null, m.id)}><button className="a-btn d">Confirm delete</button></form></details>}</div>); })}</div>}
    <Pager page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PER))} href={(p) => `/admin/media${qs(base, { page: String(p) })}`} /></>);
}
