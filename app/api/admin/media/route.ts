import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { authorize, sameOrigin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/audit";
export const dynamic = "force-dynamic";
const MAX = 4 * 1024 * 1024; // stays under typical serverless request limits
const TYPES: Record<string, { ext: string; ok: (b: Uint8Array) => boolean }> = {
  "image/png": { ext: "png", ok: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/jpeg": { ext: "jpg", ok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/gif": { ext: "gif", ok: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  "image/webp": { ext: "webp", ok: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
};
const back = (req: Request, q: string) => NextResponse.redirect(new URL(`/admin/media?${q}`, req.url), 303);
const clip = (v: FormDataEntryValue | null, n: number) => String(v ?? "").replace(/[\u0000-\u001F]/g, "").trim().slice(0, n);
export async function POST(req: Request) {
  const me = await authorize("editor");
  if (!me || !sameOrigin(req)) return new NextResponse("Forbidden", { status: 403 });
  const f = await req.formData(); const file = f.get("file");
  if (!(file instanceof File) || file.size === 0) return back(req, "error=Choose+an+image+file");
  if (file.size > MAX) return back(req, "error=Image+must+be+4+MB+or+smaller");
  const bytes = new Uint8Array(await file.arrayBuffer()); const t = TYPES[file.type];
  // Type is checked by declared MIME AND file signature. SVG and other formats are refused.
  if (!t || !t.ok(bytes)) return back(req, "error=Only+PNG,+JPEG,+GIF+and+WebP+images+are+allowed");
  const sb = createClient(); const id = clip(f.get("id"), 40);
  if (id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return back(req, "error=Invalid+file");
    const { data: m } = await sb.from("media_assets").select("storage_path").eq("id", id).maybeSingle();
    if (!m) return back(req, "error=File+not+found");
    if (!m.storage_path.endsWith(`.${t.ext}`)) return back(req, "error=The+replacement+must+be+the+same+image+type");
    const up = await sb.storage.from("media").upload(m.storage_path, bytes, { contentType: file.type, upsert: true, cacheControl: "3600" });
    if (up.error) return back(req, `error=${encodeURIComponent(up.error.message)}`);
    await sb.from("media_assets").update({ mime_type: file.type, size_bytes: file.size }).eq("id", id);
    await logActivity(sb, me.id, "media_replace", "media_asset", id);
    return back(req, "ok=Image+replaced");
  }
  const folder = clip(f.get("folder"), 40).toLowerCase() || "general";
  if (!/^[a-z0-9-]{1,40}$/.test(folder)) return back(req, "error=Folder+may+only+use+letters,+numbers+and+hyphens");
  const path = `${folder}/${randomUUID()}.${t.ext}`;
  const up = await sb.storage.from("media").upload(path, bytes, { contentType: file.type, cacheControl: "3600" });
  if (up.error) return back(req, `error=${encodeURIComponent(up.error.message)}`);
  const ins = await sb.from("media_assets").insert({ storage_path: path, title: clip(f.get("title"), 120) || null, alt_text: clip(f.get("alt_text"), 200) || null, folder, mime_type: file.type, size_bytes: file.size, uploaded_by: me.id }).select("id").single();
  if (ins.error) { await sb.storage.from("media").remove([path]); return back(req, `error=${encodeURIComponent(ins.error.message)}`); }
  await logActivity(sb, me.id, "media_upload", "media_asset", ins.data.id, { folder });
  return back(req, "ok=Image+uploaded");
}
