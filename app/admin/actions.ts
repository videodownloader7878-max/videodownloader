"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorize } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/audit";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = ["super_admin", "admin", "editor", "user"];
const MSG = ["unread", "read", "replied", "archived"];
const enc = encodeURIComponent;
// Every action re-checks the role on the server. RLS and DB triggers are a second layer.
async function guard() { const me = await authorize("admin"); if (!me) redirect("/"); return me; }
const text = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const https = (s: string) => { if (!s) return null; try { const u = new URL(s); return u.protocol === "https:" ? u.href : undefined; } catch { return undefined; } };

export async function setMessageStatus(id: string, status: string) {
  const me = await guard();
  if (!UUID.test(id) || !MSG.includes(status)) redirect("/admin/messages?error=Invalid+input");
  const sb = createClient();
  const { error } = await sb.from("contact_messages").update({ status }).eq("id", id);
  if (error) redirect(`/admin/messages/${id}?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "message_status", "contact_message", id, { status });
  revalidatePath("/admin/messages"); redirect(`/admin/messages/${id}?ok=Status+updated`);
}
export async function saveMessageNotes(id: string, f: FormData) {
  const me = await guard();
  if (!UUID.test(id)) redirect("/admin/messages?error=Invalid+input");
  const sb = createClient();
  const { error } = await sb.from("contact_messages").update({ admin_notes: text(f, "notes", 2000) || null }).eq("id", id);
  if (error) redirect(`/admin/messages/${id}?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "message_notes", "contact_message", id);
  redirect(`/admin/messages/${id}?ok=Notes+saved`);
}
export async function deleteMessage(id: string) {
  const me = await guard();
  if (!UUID.test(id)) redirect("/admin/messages?error=Invalid+input");
  const sb = createClient();
  const { error } = await sb.from("contact_messages").delete().eq("id", id);
  if (error) redirect(`/admin/messages/${id}?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "message_delete", "contact_message", id);
  revalidatePath("/admin/messages"); redirect("/admin/messages?ok=Message+deleted");
}
export async function setUserRole(id: string, f: FormData) {
  const me = await guard(); const role = text(f, "role", 20);
  if (!UUID.test(id) || !ROLES.includes(role)) redirect("/admin/users?error=Invalid+input");
  const sb = createClient();
  const { error } = await sb.from("profiles").update({ role }).eq("id", id); // DB trigger enforces who may assign which role
  if (error) redirect(`/admin/users?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "user_role_change", "profile", id, { role });
  revalidatePath("/admin/users"); redirect("/admin/users?ok=Role+updated");
}
export async function setUserActive(id: string, active: boolean) {
  const me = await guard();
  if (!UUID.test(id)) redirect("/admin/users?error=Invalid+input");
  const sb = createClient();
  const { error } = await sb.from("profiles").update({ is_active: active }).eq("id", id);
  if (error) redirect(`/admin/users?error=${enc(error.message)}`);
  await logActivity(sb, me.id, active ? "user_activate" : "user_deactivate", "profile", id);
  revalidatePath("/admin/users"); redirect(`/admin/users?ok=${active ? "Account+activated" : "Account+deactivated"}`);
}
export async function deleteUser(id: string) {
  const me = await guard();
  if (!UUID.test(id) || id === me.id) redirect("/admin/users?error=You+can’t+delete+this+account");
  const sb = createClient();
  const { data: t } = await sb.from("profiles").select("role,email").eq("id", id).maybeSingle();
  if (!t) redirect("/admin/users?error=User+not+found");
  if ((t.role === "admin" || t.role === "super_admin") && me.role !== "super_admin") redirect("/admin/users?error=Only+a+super_admin+can+remove+admins");
  const { error } = await createAdminClient().auth.admin.deleteUser(id);
  if (error) redirect(`/admin/users?error=${enc(error.message)}`);
  await logActivity(sb, me.id, "user_delete", "profile", id, { email: t.email });
  revalidatePath("/admin/users"); redirect("/admin/users?ok=User+removed");
}
export async function saveTool(slug: string, f: FormData) {
  const me = await guard(); const back = `/admin/tools/${slug}`;
  const sb = createClient();
  const { data: tool } = await sb.from("tools").select("id,integration_status").eq("slug", slug).maybeSingle();
  if (!tool) redirect("/admin/tools?error=Tool+not+found");
  const name = text(f, "name", 80); const status = text(f, "integration_status", 20);
  if (!name) redirect(`${back}?error=Name+is+required`);
  if (!["not_configured", "unverified", "verified"].includes(status)) redirect(`${back}?error=Invalid+status`);
  if (status === "verified" && tool.integration_status !== "verified" && f.get("confirm_verified") !== "on") redirect(`${back}?error=Tick+the+box+to+confirm+you+tested+this+integration`);
  const canonical = https(text(f, "canonical_url", 300)); const ogImage = https(text(f, "og_image", 300));
  if (canonical === undefined || ogImage === undefined) redirect(`${back}?error=URLs+must+start+with+https://`);
  const up = await sb.from("tools").update({ name, description: text(f, "description", 300) || null, icon: text(f, "icon", 8) || null, page_content: text(f, "page_content", 10000) || null, is_enabled: f.get("is_enabled") === "on", integration_status: status }).eq("id", tool.id);
  if (up.error) redirect(`${back}?error=${enc(up.error.message)}`);
  const seo = { scope: "tool", ref_id: tool.id, seo_title: text(f, "seo_title", 120) || null, meta_description: text(f, "meta_description", 300) || null, target_keyword: text(f, "target_keyword", 100) || null,
    secondary_keywords: text(f, "secondary_keywords", 400).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10), canonical_url: canonical, robots_index: f.get("robots_index") === "on", robots_follow: f.get("robots_follow") === "on",
    og_title: text(f, "og_title", 120) || null, og_description: text(f, "og_description", 300) || null, og_image: ogImage };
  const { data: ex } = await sb.from("seo_settings").select("id").eq("scope", "tool").eq("ref_id", tool.id).maybeSingle();
  const r = ex ? await sb.from("seo_settings").update(seo).eq("id", ex.id) : await sb.from("seo_settings").insert(seo);
  if (r.error) redirect(`${back}?error=${enc(r.error.message)}`);
  await logActivity(sb, me.id, "tool_update", "tool", tool.id, { slug, status, enabled: f.get("is_enabled") === "on" });
  await logActivity(sb, me.id, "seo_update", "tool", tool.id, { slug });
  revalidatePath(`/${slug}`); revalidatePath("/admin/tools"); redirect(`${back}?ok=Saved`);
}
