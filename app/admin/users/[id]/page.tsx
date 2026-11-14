import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/adminUi";
export default async function UserProfile({ params }: { params: { id: string } }) {
  await requireRole("admin");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const { data: u } = await createClient().from("profiles").select("*").eq("id", params.id).maybeSingle();
  if (!u) notFound();
  const rows: [string, string][] = [["User ID", u.id], ["Name", u.full_name ?? "—"], ["Email", u.email], ["Role", u.role], ["Status", u.is_active ? "Active" : "Deactivated"], ["Email verified", u.email_verified ? "Yes" : "No"], ["Registered", fmtDate(u.created_at)], ["Last login", fmtDate(u.last_login_at)]];
  return (<><p><Link href="/admin/users">← All users</Link></p><h1>{u.full_name ?? u.email}</h1><div className="a-card"><table className="tbl"><tbody>{rows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table></div></>);
}
