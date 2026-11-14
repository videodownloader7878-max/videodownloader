import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BarChart, TopList } from "@/components/admin/ui";
export default async function Analytics({ searchParams: sp }: { searchParams: { days?: string } }) {
  await requireRole("admin");
  const days = [7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30;
  const { data, error } = await createClient().rpc("admin_analytics", { p_days: days });
  if (error) return (<><h1>Analytics</h1><div className="a-card"><p className="a-err">Couldn’t load analytics: {error.message}. Run migration 0006_cms_analytics.sql.</p></div></>);
  const s = data as Record<string, any>;
  const cards: [string, number][] = [["Page views", s.page_views], ["Visitors (daily unique, summed)", s.visitors], ["Tool uses", s.tool_uses], ["Article views", s.article_views]];
  return (<><h1>Analytics</h1>
    <div className="a-tabs">{[7, 30, 90].map((d) => <Link key={d} className={`a-btn ${d === days ? "on" : ""}`} href={`/admin/analytics?days=${d}`}>Last {d} days</Link>)}</div>
    <div className="a-stats">{cards.map(([l, v]) => <div key={l} className="a-card a-stat"><span>{l}</span><b>{Number(v).toLocaleString("en-US")}</b></div>)}</div>
    <div className="a-grid2"><BarChart title="Daily page views" data={s.daily_views} /><BarChart title="Daily visitors" data={s.daily_visitors} />
      <TopList title="Top pages" rows={s.pages} /><TopList title="Top tools" rows={s.tools} /><TopList title="Top articles" rows={s.articles} /></div>
    <p className="a-muted" style={{ marginTop: 14 }}>These numbers come from MediaAura’s own anonymous event log. They don’t include Google Search Console or ranking data. Connect Search Console separately for that.</p></>);
}
