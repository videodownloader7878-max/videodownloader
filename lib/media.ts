import { createClient } from "@/lib/supabase/server";
export type MediaItem = { id: string; url: string; alt: string; title: string };
// Recent images for the editor's image picker.
export async function getMediaList(limit = 100): Promise<MediaItem[]> {
  const sb = createClient();
  const { data } = await sb.from("media_assets").select("id,storage_path,alt_text,title").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((m) => ({ id: m.id, url: sb.storage.from("media").getPublicUrl(m.storage_path).data.publicUrl, alt: m.alt_text ?? "", title: m.title ?? "" }));
}
