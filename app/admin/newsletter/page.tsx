import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash, Pager } from "@/components/admin/ui";
import { qs, fmtDate, safeSearch, pageNum } from "@/lib/adminUi";
import { setSubscriberStatus, deleteSubscriber } from "../actions2";
const PER = 25; const ST = ["subscribed", "unsubscribed", "pending"];
export default async function Newsletter({ searchParams: sp }: { searchParams: { q?: string; status?: string; page?: string; error?: string; ok?: string } }) {
  await requireRole("admin");
  const page = pageNum(sp.page), s = safeSearch(sp.q);
  let q = createClient().from("newsletter_subscribers").select("id,email,status,consent_at,created_at", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PER, page * PER - 1);
  if (sp.status && ST.includes(sp.status)) q = q.eq("status", sp.status); if (s) q = q.ilike("email", `%${s}%`);
  const { data, count, error } = await q; const base = { q: s, status: sp.status };
  return (<><h1>Newsletter Management</h1><Flash error={sp.error ?? error?.message} ok={sp.ok} />
    <form className="a-filters"><input name="q" defaultValue={s} placeholder="Search email" aria-label="Search" /><select name="status" defaultValue={sp.status ?? ""} aria-label="Status"><option value="">All</option>{ST.map((x) => <option key={x}>{x}</option>)}</select><button className="a-btn p">Filter</button>
      <a className="a-btn" href="/admin/newsletter/export">Export consented subscribers (CSV)</a></form>
    <div className="a-card a-scroll">{(data ?? []).length === 0 ? <p className="a-muted">No subscribers yet.</p> : <table className="tbl"><thead><tr><th>Email</th><th>Status</th><th>Consent given</th><th>Subscribed</th><th /></tr></thead><tbody>
      {data!.map((r) => <tr key={r.id}><td>{r.email}</td><td><span className={`a-tag ${r.status === "subscribed" ? "g" : ""}`}>{r.status}</span></td><td>{fmtDate(r.consent_at)}</td><td>{fmtDate(r.created_at)}</td>
        <td><div className="a-inline">{r.status === "subscribed" ? <form action={setSubscriberStatus.bind(null, r.id, "unsubscribed")}><button className="a-btn">Unsubscribe</button></form> : <small className="a-muted" title="Resubscribing requires the person’s own consent">needs own consent</small>}
          <details><summary className="a-btn d">Remove</summary><form action={deleteSubscriber.bind(null, r.id)}><button className="a-btn d">Confirm remove</button></form></details></div></td></tr>)}</tbody></table>}</div>
    <Pager page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PER))} href={(p) => `/admin/newsletter${qs(base, { page: String(p) })}`} /></>);
}
