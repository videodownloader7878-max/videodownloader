import Link from "next/link";
import { requireRole, hasRole } from "@/lib/auth";
import { adminNav } from "@/lib/adminNav";
import SignOutButton from "@/components/admin/SignOutButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – MediaAura", robots: { index: false, follow: false } };
// First gate. Every admin page and server action ALSO checks the role itself, because layouts don't re-run on client navigation.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const p = await requireRole("editor");
  return (
    <div className="adm">
      <aside className="a-side">
        <div className="a-brand"><span className="logo" style={{ width: 32, height: 32, borderRadius: 10 }}>▶</span> MediaAura Admin</div>
        <nav aria-label="Admin">
          {adminNav.filter((n) => hasRole(p, n.min)).map((n) => n.built
            ? <Link key={n.href} className="a-nav" href={n.href}>{n.label}</Link>
            : <Link key={n.href} className="a-nav a-soon" href={n.href}>{n.label}<small>soon</small></Link>)}
          <Link className="a-nav" href="/">View site</Link>
          <SignOutButton />
        </nav>
        <p className="a-who">{p.email}<br />{p.role}</p>
      </aside>
      <main className="a-main">{children}</main>
    </div>
  );
}
