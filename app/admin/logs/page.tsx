import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Pager } from "@/components/admin/ui";
import { fmtDate, pageNum } from "@/lib/adminUi";
const PER = 30;
export default async function Logs({ searchParams: sp }: { searchParams: { page?: string } }) {
  await requireRole("admin");
  const page = pageNum(sp.page);
  const { data, count, error } = await createClient().from("activity_logs").select("id,action,entity_type,entity_id,details,created_at,profiles(email)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  return (<><h1>Security &amp; Activity Logs</h1>{error && <p className="a-flash a-err">{error.message}</p>}
    <div className="a-card a-scroll">{(data ?? []).length === 0 ? <p className="a-muted">No activity recorded yet.</p> : <table className="tbl"><thead><tr><th>Activity</th><th>Admin account</th><th>Time</th><th>Record</th></tr></thead><tbody>
      {data!.map((l: any) => <tr key={l.id}><td><b>{l.action}</b></td><td>{l.profiles?.email ?? "—"}</td><td>{fmtDate(l.created_at)}</td><td><small className="a-muted">{l.entity_type ?? ""} {l.entity_id ?? ""}</small></td></tr>)}</tbody></table>}</div>
    <Pager page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PER))} href={(p) => `/admin/logs?page=${p}`} /></>);
}
