import Link from "next/link";
import { requireRole, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BarChart, TopList } from "@/components/admin/ui";
import { fmtDate } from "@/lib/adminUi";
export default async function Dashboard() {
  const me = await requireRole("editor");
  if (!hasRole(me, "admin")) return (<><h1>Dashboard</h1><div className="a-card"><p>Welcome, {me.full_name ?? me.email}. Your role is editor. Content modules (blog, pages, SEO, media) will appear here as they’re built.</p></div></>);
  const sb = createClient();
  const [stats, regs, msgs, posts, logs] = await Promise.all([
    sb.rpc("admin_dashboard_stats"),
    sb.from("profiles").select("id,email,created_at").order("created_at", { ascending: false }).limit(5),
    sb.from("contact_messages").select("id,name,subject,status,created_at").order("created_at", { ascending: false }).limit(5),
    sb.from("blog_posts").select("id,title,published_at").eq("status", "published").order("published_at", { ascending: false }).limit(5),
    sb.from("activity_logs").select("id,action,created_at,profiles(email)").order("created_at", { ascending: false }).limit(5),
  ]);
  if (stats.error) return (<><h1>Dashboard</h1><div className="a-card"><p className="a-err">Couldn’t load statistics: {stats.error.message}. Make sure migration 0005_admin_stats.sql has been run.</p></div></>);
  const s = stats.data as Record<string, any>;
  const cards: [string, number][] = [["Total visitors (daily unique, summed)", s.visitors_total], ["Today’s visitors", s.visitors_today], ["Monthly visitors (30 days)", s.visitors_month], ["Registered users", s.users],
    ["Total articles", s.posts_total], ["Published articles", s.posts_published], ["Draft articles", s.posts_draft], ["Total tool usage", s.tool_uses], ["Contact messages", s.messages], ["Unread messages", s.messages_unread], ["Newsletter subscribers", s.subscribers]];
  return (<><h1>Dashboard</h1>
    <div className="a-stats">{cards.map(([l, v]) => <div key={l} className="a-card a-stat"><span>{l}</span><b>{Number(v).toLocaleString("en-US")}</b></div>)}</div>
    <div className="a-grid2">
      <BarChart title="Daily visitors (30 days)" data={s.daily} /><BarChart title="Weekly traffic (page views)" data={s.weekly} />
      <BarChart title="Monthly traffic (page views)" data={s.monthly} /><BarChart title="New user registrations (30 days)" data={s.signups} />
      <TopList title="Popular tools" rows={s.tools} /><TopList title="Article performance (views)" rows={s.articles} />
      <TopList title="Most visited pages" rows={s.pages} />
      <div className="a-card"><h3>Recent registrations</h3>{(regs.data ?? []).length === 0 ? <p className="a-muted">No users yet.</p> : <ul className="a-list">{regs.data!.map((u) => <li key={u.id}><span>{u.email}</span><small>{fmtDate(u.created_at)}</small></li>)}</ul>}</div>
      <div className="a-card"><h3>Latest contact messages</h3>{(msgs.data ?? []).length === 0 ? <p className="a-muted">No messages yet.</p> : <ul className="a-list">{msgs.data!.map((m) => <li key={m.id}><Link href={`/admin/messages/${m.id}`}>{m.subject}</Link><small>{m.name} · {m.status}</small></li>)}</ul>}</div>
      <div className="a-card"><h3>Recently published articles</h3>{(posts.data ?? []).length === 0 ? <p className="a-muted">No published articles yet.</p> : <ul className="a-list">{posts.data!.map((p) => <li key={p.id}><span>{p.title}</span><small>{fmtDate(p.published_at)}</small></li>)}</ul>}</div>
      <div className="a-card"><h3>Recent administrative activity</h3>{(logs.data ?? []).length === 0 ? <p className="a-muted">No activity yet.</p> : <ul className="a-list">{logs.data!.map((l: any) => <li key={l.id}><span>{l.action}</span><small>{l.profiles?.email ?? "—"} · {fmtDate(l.created_at)}</small></li>)}</ul>}</div>
    </div></>);
}
