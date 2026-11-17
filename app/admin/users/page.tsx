import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash, Pager } from "@/components/admin/ui";
import { qs, fmtDate, safeSearch, pageNum } from "@/lib/adminUi";
import { setUserRole, setUserActive, deleteUser } from "../actions";
const PER = 20; const ROLES = ["super_admin", "admin", "editor", "user"];
type SP = { q?: string; role?: string; page?: string; error?: string; ok?: string };
export default async function Users({ searchParams: sp }: { searchParams: SP }) {
  const me = await requireRole("admin");
  const page = pageNum(sp.page), s = safeSearch(sp.q);
  let q = createClient().from("profiles").select("id,email,full_name,role,is_active,email_verified,created_at,last_login_at", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  if (sp.role && ROLES.includes(sp.role)) q = q.eq("role", sp.role);
  if (s) q = q.or(`email.ilike.%${s}%,full_name.ilike.%${s}%`);
  const { data, count, error } = await q;
  const base = { q: s, role: sp.role };
  const assignable = me.role === "super_admin" ? ROLES : ["editor", "user"];
  return (<><h1>Users Management</h1><Flash error={sp.error ?? error?.message} ok={sp.ok} />
    <form className="a-filters"><input name="q" defaultValue={s} placeholder="Search name or email" aria-label="Search" />
      <select name="role" defaultValue={sp.role ?? ""} aria-label="Role"><option value="">All roles</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
      <button className="a-btn p">Filter</button><a className="a-btn" href={`/admin/users/export${qs(base)}`}>Export CSV</a></form>
    <div className="a-card a-scroll">{(data ?? []).length === 0 ? <p className="a-muted">No users found.</p> : <table className="tbl"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Registered</th><th>Last login</th><th>Actions</th></tr></thead><tbody>
      {data!.map((u) => { const self = u.id === me.id; const locked = self || (me.role !== "super_admin" && (u.role === "admin" || u.role === "super_admin")); return (
        <tr key={u.id}><td><Link href={`/admin/users/${u.id}`}><b>{u.full_name ?? u.email}</b></Link><br /><small className="a-muted">{u.email} · {u.email_verified ? "verified" : "unverified"}</small></td>
          <td>{locked ? <span className="a-tag">{u.role}</span> : <form action={setUserRole.bind(null, u.id)} className="a-inline"><select name="role" defaultValue={u.role} aria-label="Role" style={{ padding: 6 }}>{assignable.map((r) => <option key={r}>{r}</option>)}</select><button className="a-btn">Save</button></form>}</td>
          <td><span className={`a-tag ${u.is_active ? "g" : "r"}`}>{u.is_active ? "active" : "deactivated"}</span></td><td>{fmtDate(u.created_at)}</td><td>{fmtDate(u.last_login_at)}</td>
          <td>{locked ? <small className="a-muted">{self ? "You" : "Protected"}</small> : <div className="a-inline"><form action={setUserActive.bind(null, u.id, !u.is_active)}><button className="a-btn">{u.is_active ? "Deactivate" : "Activate"}</button></form>
            <details><summary className="a-btn d">Remove</summary><form action={deleteUser.bind(null, u.id)}><button className="a-btn d">Confirm remove</button></form></details></div>}</td></tr>); })}</tbody></table>}</div>
    <Pager page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PER))} href={(p) => `/admin/users${qs(base, { page: String(p) })}`} /></>);
}
