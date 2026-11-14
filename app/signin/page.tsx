"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) { setError("Email or password is incorrect."); setBusy(false); return; }
    await fetch("/api/auth/after-login", { method: "POST" });
    const next = params.get("next") ?? "/";
    router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/"); router.refresh();
  }
  return (
    <main className="wrap" style={{ maxWidth: 420, padding: "64px 20px" }}>
      <form onSubmit={submit} className="why" style={{ display: "grid", gap: 14 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Sign In</h1>
        <input className="nl" style={{ padding: 12, background: "var(--card)", color: "var(--tx)" }} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <input className="nl" style={{ padding: 12, background: "var(--card)", color: "var(--tx)" }} type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <p role="alert" style={{ color: "#ffd84a", margin: 0 }}>{error}</p>}
        <button className="btn" disabled={busy} style={{ justifyContent: "center" }}>{busy ? "Signing in…" : "Sign In"}</button>
      </form>
    </main>
  );
}
export default function SignIn() { return <Suspense><Form /></Suspense>; }
