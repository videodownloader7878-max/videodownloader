"use client";
import { useEffect, useState } from "react";
import { validateUrl } from "@/lib/adapters";
type Result = { platform: string; preview: { title: string; author: string | null; thumbnail: string | null } | null; limitation: string; alternatives: string[] };
export default function ToolClient({ slug, platform }: { slug: string; platform: string }) {
  const [value, setValue] = useState(""); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [res, setRes] = useState<Result | null>(null);
  useEffect(() => { const u = new URLSearchParams(window.location.search).get("url"); if (u) setValue(u); }, []);
  async function check() {
    setError(""); setRes(null);
    if (!validateUrl(slug, value)) { setError(`Enter a full https:// link from ${platform}.`); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, url: value }) });
      const j = await r.json();
      if (!r.ok) setError(j.error ?? "Something went wrong. Try again."); else setRes(j);
    } catch { setError("Network error. Check your connection and try again."); }
    setBusy(false);
  }
  return (<>
    <div className="field"><input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} type="url" placeholder={`Paste your ${platform} link here…`} aria-label={`${platform} link`} />
      <button className="btn" onClick={check} disabled={busy}>{busy ? "Checking…" : "Check link"}</button></div>
    {error && <p className="warn" role="alert">{error}</p>}
    {res && <div className="result">
      {res.preview && <div className="card prev">{res.preview.thumbnail && /* eslint-disable-next-line @next/next/no-img-element */ <img src={res.preview.thumbnail} alt="" referrerPolicy="no-referrer" />}
        <div><b>{res.preview.title}</b>{res.preview.author && <div style={{ color: "var(--mut)", fontSize: 13 }}>{res.preview.author}</div>}</div></div>}
      <div className="card"><h3>Download isn’t available for this link</h3><p style={{ margin: 0, fontSize: 14 }}>{res.limitation}</p></div>
      <div className="card"><h3>Official alternatives</h3><ul>{res.alternatives.map((a) => <li key={a}>{a}</li>)}</ul></div>
    </div>}
  </>);
}
