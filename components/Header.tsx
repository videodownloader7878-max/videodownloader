"use client";
import { useEffect, useState } from "react";
export default function Header({ brandName = "MediaAura", tagline = "Download · Convert · Enjoy", logoUrl = "" }: { brandName?: string; tagline?: string; logoUrl?: string }) {
  const [theme, setTheme] = useState("dark");
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    try { const s = localStorage.getItem("theme"); if (s === "light" || s === "dark") { setTheme(s); document.documentElement.dataset.theme = s; } } catch {}
    fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).then((d) => setRole(d.role)).catch(() => setRole(null));
  }, []);
  function toggle() {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n); document.documentElement.dataset.theme = n;
    try { localStorage.setItem("theme", n); } catch {}
  }
  async function signOut() { await fetch("/api/auth/signout", { method: "POST" }); window.location.href = "/"; }
  const staff = role === "editor" || role === "admin" || role === "super_admin";
  return (
    <header><div className="wrap">
      <a className="brand" href="/">{logoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logoUrl} alt="" width={40} height={40} style={{ borderRadius: 12 }} /> : <span className="logo">▶</span>}<span>{brandName}<small>{tagline}</small></span></a>
      <nav aria-label="Main"><a className="on" href="/">Home</a><a href="/#tools">All Tools</a><a href="/blog">Blog</a><a href="/about">About</a><a href="/contact">Contact</a></nav>
      <div className="hr">
        <button className="tg" onClick={toggle} aria-label="Toggle light and dark theme">☀ ☾</button>
        {staff && <a className="btn" href="/admin">Admin Dashboard</a>}
        {role ? <button className="btn" onClick={signOut}>Sign out</button> : <a className="btn" href="/signin">Sign In</a>}
      </div>
    </div></header>
  );
}
