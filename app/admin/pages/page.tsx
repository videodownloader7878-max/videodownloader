import Link from "next/link";
import { requireRole, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/admin/ui";
import { fmtDate } from "@/lib/adminUi";
import { deletePage } from "../actions2";
export default async function Pages({ searchParams: sp }: { searchParams: { error?: string; ok?: string } }) {
  const me = await requireRole("editor");
  const { data, error } = await createClient().from("pages").select("id,title,slug,status,updated_at").order("title");
  return (<><h1>Pages Management</h1><Flash error={sp.error ?? error?.message} ok={sp.ok} />
    <p><Link className="a-btn p" href="/admin/pages/new">+ New page</Link></p>
    <div className="a-card a-scroll"><table className="tbl"><thead><tr><th>Title</th><th>URL</th><th>Status</th><th>Last updated</th><th /></tr></thead><tbody>
      {(data ?? []).map((p) => <tr key={p.id}><td><Link href={`/admin/pages/${p.id}`}><b>{p.title}</b></Link></td><td>/{p.slug}</td><td><span className={`a-tag ${p.status === "published" ? "g" : ""}`}>{p.status}</span></td><td>{fmtDate(p.updated_at)}</td>
        <td><div className="a-inline"><Link className="a-btn" href={`/admin/pages/${p.id}`}>Edit</Link>{hasRole(me, "admin") && <details><summary className="a-btn d">Delete</summary><form action={deletePage.bind(null, p.id)}><button className="a-btn d">Confirm delete</button></form></details>}</div></td></tr>)}</tbody></table>
      {(data ?? []).length === 0 && <p className="a-muted">No pages yet. Run migration 0004 or create one.</p>}</div></>);
}
