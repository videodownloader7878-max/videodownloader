"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function PasswordForm() {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [msg, setMsg] = useState(""); const [bad, setBad] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBad(true);
    if (pw.length < 12) return setMsg("Use at least 12 characters."); if (pw !== pw2) return setMsg("The two passwords don’t match.");
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    setBad(false); setMsg("Password changed."); setPw(""); setPw2("");
  }
  return (<form onSubmit={submit} className="a-form a-card"><h3>Change password</h3>
    <label>New password<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" style={{ padding: 9, border: "1px solid #e3e7f3", borderRadius: 9 }} /></label>
    <label>Repeat new password<input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" style={{ padding: 9, border: "1px solid #e3e7f3", borderRadius: 9 }} /></label>
    {msg && <p className={`a-flash ${bad ? "a-err" : "a-ok"}`} role="status">{msg}</p>}<div><button className="a-btn p">Change password</button></div></form>);
}
