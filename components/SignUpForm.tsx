"use client";
import { useState } from "react";
export default function SignUpForm() {
  const [f, setF] = useState({ email: "", password: "" }); const [msg, setMsg] = useState(""); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    try { const r = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); const j = await r.json(); setOk(r.ok); setMsg(r.ok ? "Check your email to confirm your account." : j.error ?? "Couldn’t create the account."); } catch { setMsg("Network error. Try again."); }
    setBusy(false);
  }
  return (<form onSubmit={submit} className="formgrid">
    <input type="email" required placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" aria-label="Email" />
    <input type="password" required minLength={12} placeholder="Password (12+ characters)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" aria-label="Password" />
    {msg && <p className={ok ? "" : "warn"} role="status">{msg}</p>}<button className="btn" disabled={busy} style={{ justifyContent: "center" }}>{busy ? "Creating…" : "Create account"}</button></form>);
}
