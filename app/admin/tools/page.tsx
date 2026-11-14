import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/admin/ui";
export default async function Tools({ searchParams: sp }: { searchParams: { error?: string; ok?: string } }) {
  await requireRole("admin");
  const sb = createClient();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [tools, uses] = await Promise.all([
    sb.from("tools").select("slug,name,is_enabled,integration_status").order("sort_order"),
    sb.from("usage_events").select("tool_slug").eq("event_type", "tool_use").gte("created_at", since).limit(20000),
  ]);
  const n: Record<string, number> = {}; (uses.data ?? []).forEach((u) => { if (u.tool_slug) n[u.tool_slug] = (n[u.tool_slug] ?? 0) + 1; });
  return (<><h1>Tools Management</h1><Flash error={sp.error ?? tools.error?.message} ok={sp.ok} />
    <div className="a-card a-scroll"><table className="tbl"><thead><tr><th>Tool</th><th>Page</th><th>Integration</th><th>Uses (30 days)</th><th /></tr></thead><tbody>
      {(tools.data ?? []).map((t) => <tr key={t.slug}><td><b>{t.name}</b></td><td><span className={`a-tag ${t.is_enabled ? "g" : "r"}`}>{t.is_enabled ? "enabled" : "disabled"}</span></td>
        <td><span className={`a-tag ${t.integration_status === "verified" ? "g" : t.integration_status === "unverified" ? "y" : ""}`}>{t.integration_status.replace("_", " ")}</span></td><td>{n[t.slug] ?? 0}</td><td><Link className="a-btn" href={`/admin/tools/${t.slug}`}>Edit</Link></td></tr>)}</tbody></table></div></>);
}
