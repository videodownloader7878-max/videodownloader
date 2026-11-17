import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
export default async function Roles() {
  await requireRole("super_admin"); const sb = createClient();
  const [roles, profiles] = await Promise.all([sb.from("admin_roles").select("*"), sb.from("profiles").select("role").limit(20000)]);
  const n: Record<string, number> = {}; (profiles.data ?? []).forEach((p) => { n[p.role] = (n[p.role] ?? 0) + 1; });
  const order = ["super_admin", "admin", "editor", "user"];
  return (<><h1>Roles &amp; Permissions</h1>
    <div className="a-card a-scroll"><table className="tbl"><thead><tr><th>Role</th><th>Description</th><th>Areas</th><th>Users</th></tr></thead><tbody>
      {(roles.data ?? []).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role)).map((r) => <tr key={r.role}><td><b>{r.role}</b></td><td>{r.description}</td><td>{r.permissions.join(", ") || "—"}</td><td>{n[r.role] ?? 0}</td></tr>)}</tbody></table></div>
    <div className="a-card" style={{ marginTop: 14 }}><h3>How permissions are enforced</h3><ul className="a-list" style={{ display: "block" }}>
      <li>Roles are fixed in code and in database policies (RLS) and triggers. This table documents them; editing it would not change access.</li>
      <li>Assign roles on the Users page. Only a super_admin can create or change admins and super_admins.</li>
      <li>Nobody can change their own role or deactivate themselves.</li></ul></div></>);
}
