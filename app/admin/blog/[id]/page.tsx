import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMediaList } from "@/lib/media";
import { Flash } from "@/components/admin/ui";
import PostForm from "@/components/admin/PostForm";
import { savePost } from "../../actions2";
export default async function EditPost({ params, searchParams: sp }: { params: { id: string }; searchParams: { ok?: string; error?: string } }) {
  const me = await requireRole("editor"); const isNew = params.id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const sb = createClient();
  const [post, cats, media, linkPosts, linkPages, staff] = await Promise.all([
    isNew ? Promise.resolve({ data: { status: "draft", content: "" } as any }) : sb.from("blog_posts").select("*").eq("id", params.id).maybeSingle(),
    sb.from("categories").select("id,name").order("name"), getMediaList(),
    sb.from("blog_posts").select("title,slug").in("status", ["published", "scheduled"]).order("published_at", { ascending: false }).limit(50),
    sb.from("pages").select("title,slug").eq("status", "published").limit(30),
    hasRole(me, "admin") ? sb.from("profiles").select("id,full_name,email").in("role", ["super_admin", "admin", "editor"]) : Promise.resolve({ data: [] as any[] }),
  ]);
  if (!post.data) notFound();
  const p = post.data as Record<string, any>;
  const seo = isNew ? null : (await sb.from("seo_settings").select("*").eq("scope", "post").eq("ref_id", params.id).maybeSingle()).data;
  const tags = isNew ? [] : ((await sb.from("blog_post_tags").select("tags(name)").eq("post_id", params.id)).data ?? []);
  const links = [...(linkPosts.data ?? []).filter((x) => x.slug !== p.slug).map((x) => ({ title: x.title, href: `/blog/${x.slug}` })), ...(linkPages.data ?? []).map((x) => ({ title: x.title, href: `/${x.slug}` }))];
  const faqText = (Array.isArray(p.faq) ? p.faq : []).map((f: any) => `${f.q} | ${f.a}`).join("\n");
  return (<><p><Link href="/admin/blog">← All articles</Link>{!isNew && p.status === "published" && <> · <Link href={`/blog/${p.slug}`} target="_blank">View live</Link></>}</p>
    <h1>{isNew ? "New article" : p.title}</h1><Flash error={sp.error} ok={sp.ok} />
    <PostForm action={savePost.bind(null, params.id)} post={p} seo={seo} categories={cats.data ?? []} tagsText={tags.map((t: any) => t.tags?.name).filter(Boolean).join(", ")} faqText={faqText}
      authors={(staff.data ?? []).map((a: any) => ({ id: a.id, name: a.full_name ?? a.email }))} media={media} links={links} /></>);
}
