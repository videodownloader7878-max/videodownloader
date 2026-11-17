"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export default function ContactForm() {
  const start = useRef(0); const box = useRef<HTMLDivElement>(null);
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "", website: "" }); const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle"); const [error, setError] = useState("");
  useEffect(() => { start.current = Date.now(); }, []);
  const renderCaptcha = () => { const t = (window as any).turnstile; if (SITE_KEY && t && box.current && !box.current.hasChildNodes()) t.render(box.current, { sitekey: SITE_KEY, callback: setToken }); };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setState("busy"); setError("");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, token, elapsed: Date.now() - start.current }) });
      const j = await r.json();
      if (r.ok) { setState("ok"); return; }
      setError(j.error ?? "Something went wrong.");
    } catch { setError("Network error. Try again."); }
    setState("idle");
  }
  if (state === "ok") return <div className="card"><h3>Message sent</h3><p style={{ margin: 0 }}>Thanks for getting in touch. We’ll reply by email.</p></div>;
  return (
    <form onSubmit={submit} className="formgrid">
      <input placeholder="Name" required maxLength={100} value={f.name} onChange={set("name")} autoComplete="name" aria-label="Name" />
      <input placeholder="Email" type="email" required maxLength={254} value={f.email} onChange={set("email")} autoComplete="email" aria-label="Email" />
      <input placeholder="Subject" required maxLength={150} value={f.subject} onChange={set("subject")} aria-label="Subject" />
      <textarea placeholder="Message" required minLength={10} maxLength={5000} rows={6} value={f.message} onChange={set("message")} aria-label="Message" />
      <div className="hp" aria-hidden="true"><input tabIndex={-1} autoComplete="off" placeholder="Website" value={f.website} onChange={set("website")} /></div>
      {SITE_KEY && <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={renderCaptcha} /><div ref={box} /></>}
      {error && <p className="warn" role="alert">{error}</p>}
      <button className="btn" disabled={state === "busy"} style={{ justifyContent: "center" }}>{state === "busy" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
