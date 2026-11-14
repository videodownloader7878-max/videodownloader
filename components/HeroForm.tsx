"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { detectTool } from "@/lib/tools";
export default function HeroForm({ placeholder = "Paste your video link here…", label = "⬇ Download" }: { placeholder?: string; label?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");
  function go() {
    let u: URL;
    try { u = new URL(value.trim()); if (!/^https?:$/.test(u.protocol)) throw 0; } catch { setMsg("Enter a full link that starts with https://"); return; }
    const t = detectTool(u);
    if (!t) { setMsg("This platform isn’t supported. Choose a tool from the list below."); return; }
    router.push(`/${t.slug}?url=${encodeURIComponent(u.href)}`);
  }
  return (<>
    <div className="field"><input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} type="url" placeholder={placeholder} aria-label="Video link" /><button className="btn" onClick={go}>{label}</button></div>
    <div id="msg" role="status">{msg}</div>
  </>);
}
