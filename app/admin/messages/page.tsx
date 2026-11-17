import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash, Pager } from "@/components/admin/ui";
import { qs, fmtDate, safeSearch, pageNum } from "@/lib/adminUi";
const PER = 20; const STATUSES = ["unread", "read", "replied", "archived"];
type SP = { status?: string; q?: string; from?: string; to?: string; page?: string; error?: string; ok?: string };
export default async function Messages({ searchParams: sp }: { searchParams: SP }) {
  await requireRole("admin");
  const page = pageNum(sp.page), s = safeSearch(sp.q), date = /^\d{4}-\d{2}-\d{2}$/;
  let q = createClient().from("contact_messages").select("id,name,email,subject,status,created_at", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  if (sp.status && STATUSES.includes(sp.status)) q = q.eq("status", sp.status);
  if (s) q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,subject.ilike.%${s}%`);
  if (sp.from && date.test(sp.from)) q = q.gte("created_at", `${sp.from}T00:00:00Z`);
  if (sp.to && date.test(sp.to)) q = q.lte("created_at", `${sp.to}T23:59:59Z`);
  const { data, count, error } = await q;
  const base = { status: sp.status, q: s, from: sp.from, to: sp.to };
  return (<><h1>Messages / Inquiries</h1><Flash error={sp.error ?? error?.message} ok={sp.ok} />
    <div className="a-tabs">{[["", "All"], ...STATUSES.map((x) => [x, x[0].toUpperCase() + x.slice(1)])].map(([v, l]) => <Link key={l} className={`a-btn ${(sp.status ?? "") === v ? "on" : ""}`} href={`/admin/messages${qs(base, { status: v, page: undefined })}`}>{l}</Link>)}</div>
    <form className="a-filters"><input name="q" defaultValue={s} placeholder="Search name, email, subject" aria-label="Search" /><input type="date" name="from" defaultValue={sp.from} aria-label="From date" /><input type="date" name="to" defaultValue={sp.to} aria-label="To date" />
      {sp.status && <input type="hidden" name="status" value={sp.status} />}<button className="a-btn p">Filter</button></form>
    <div className="a-card a-scroll">{(data ?? []).length === 0 ? <p className="a-muted">No messages found.</p> : <table className="tbl"><thead><tr><th>From</th><th>Subject</th><th>Status</th><th>Received</th></tr></thead><tbody>
      {data!.map((m) => <tr key={m.id}><td>{m.name}<br /><small className="a-muted">{m.email}</small></td><td><Link href={`/admin/messages/${m.id}`}><b>{m.subject}</b></Link></td>
        <td><span className={`a-tag ${m.status === "unread" ? "y" : m.status === "replied" ? "g" : ""}`}>{m.status}</span></td><td>{fmtDate(m.created_at)}</td></tr>)}</tbody></table>}</div>
    <Pager page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PER))} href={(p) => `/admin/messages${qs(base, { page: String(p) })}`} /></>);
}
