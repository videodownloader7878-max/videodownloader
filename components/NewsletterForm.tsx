"use client";
import { useState } from "react";
export default function NewsletterForm() {
  const [email, setEmail] = useState(""); const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, consent }) });
      const j = await r.json();
      if (r.ok) { setMsg("Thanks! You’re subscribed."); setEmail(""); setConsent(false); } else setMsg(j.error ?? "Something went wrong.");
    } catch { setMsg("Network error. Try again."); }
    setBusy(false);
  }
  return (<>
    <div className="nl"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your Email Address" aria-label="Email address" />
      <button className="btn" onClick={submit} disabled={busy}>Subscribe</button></div>
    <label style={{ display: "flex", gap: 8, fontSize: 12, marginTop: 8, color: "#b9c1ea" }}><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I agree to receive email updates and can unsubscribe any time.</label>
    <p id="nlmsg" role="status">{msg}</p>
  </>);
}
