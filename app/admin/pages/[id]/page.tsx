import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMediaList } from "@/lib/media";
import { Flash } from "@/components/admin/ui";
import PageForm from "@/components/admin/PageForm";
import { savePage } from "../../actions2";
export default async function EditPage({ params, searchParams: sp }: { params: { id: string }; searchParams: { ok?: string; error?: string } }) {
  await requireRole("editor"); const isNew = params.id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const sb = createClient();
  const [page, media, posts] = await Promise.all([isNew ? Promise.resolve({ data: { status: "draft", content: "" } as any }) : sb.from("pages").select("*").eq("id", params.id).maybeSingle(), getMediaList(), sb.from("blog_posts").select("title,slug").in("status", ["published", "scheduled"]).limit(50)]);
  if (!page.data) notFound();
  const p = page.data as Record<string, any>;
  const seo = isNew ? null : (await sb.from("seo_settings").select("*").eq("scope", "page").eq("ref_id", params.id).maybeSingle()).data;
  return (<><p><Link href="/admin/pages">← All pages</Link></p><h1>{isNew ? "New page" : p.title}</h1><Flash error={sp.error} ok={sp.ok} />
    {!isNew && <p className="a-muted">Last updated {new Date(p.updated_at).toLocaleString("en-US")}</p>}
    <PageForm action={savePage.bind(null, params.id)} page={p} seo={seo} media={media} links={(posts.data ?? []).map((x) => ({ title: x.title, href: `/blog/${x.slug}` }))} /></>);
}
