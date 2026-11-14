"use client";
import { useEffect, useRef, useState } from "react";
const MAX = 300 * 1024 * 1024; // browser memory limit for in-browser conversion
const EXT = ["mp4", "mov", "mkv", "webm", "avi", "m4v", "mp3", "m4a", "wav", "flac", "ogg", "aac"];
const fmt = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`);
export default function Mp3Converter() {
  const [file, setFile] = useState<File | null>(null);
  const [own, setOwn] = useState(false);
  const [pct, setPct] = useState(0); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""); const [out, setOut] = useState<{ url: string; name: string; size: number } | null>(null);
  const urlRef = useRef<string | null>(null);
  const revoke = () => { if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; } };
  useEffect(() => revoke, []);
  function pick(f: File | undefined) {
    revoke(); setOut(null); setError(""); setPct(0); setFile(null);
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!(f.type.startsWith("video/") || f.type.startsWith("audio/") || EXT.includes(ext))) { setError("Choose a video or audio file (MP4, MOV, MKV, WebM, WAV, M4A…)."); return; }
    if (f.size === 0) { setError("This file is empty."); return; }
    if (f.size > MAX) { setError(`File is too large (${fmt(f.size)}). The limit is 300 MB.`); return; }
    setFile(f);
  }
  async function convert() {
    if (!file || !own) return;
    setBusy(true); setError(""); setPct(0); revoke(); setOut(null);
    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
    const inName = `input.${ext}`;
    let ff: import("@ffmpeg/ffmpeg").FFmpeg | null = null;
    try {
      const [{ FFmpeg }, { fetchFile }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
      ff = new FFmpeg();
      ff.on("progress", ({ progress }) => setPct(Math.max(0, Math.min(100, Math.round(progress * 100)))));
      await ff.load({ coreURL: "/ffmpeg/ffmpeg-core.js", wasmURL: "/ffmpeg/ffmpeg-core.wasm" });
      await ff.writeFile(inName, await fetchFile(file));
      const code = await ff.exec(["-i", inName, "-vn", "-c:a", "libmp3lame", "-q:a", "2", "out.mp3"]);
      if (code !== 0) throw new Error("exec");
      const data = (await ff.readFile("out.mp3")) as Uint8Array;
      const blob = new Blob([data as unknown as BlobPart], { type: "audio/mpeg" });
      urlRef.current = URL.createObjectURL(blob);
      setOut({ url: urlRef.current, name: `${file.name.replace(/\.[^.]+$/, "").replace(/[^\w\- ]+/g, "").trim() || "audio"}.mp3`, size: blob.size });
      setPct(100);
    } catch { setError("Conversion failed. The file may be damaged or have no audio track. Try another file."); }
    finally {
      try { await ff?.deleteFile(inName); await ff?.deleteFile("out.mp3"); } catch {}
      try { ff?.terminate(); } catch {}
      setBusy(false);
    }
  }
  return (<div className="result">
    <div className="card"><h3>1. Choose a file</h3>
      <input type="file" accept="video/*,audio/*,.mkv" onChange={(e) => pick(e.target.files?.[0])} disabled={busy} aria-label="Video or audio file" />
      {file && <p style={{ fontSize: 13, color: "var(--mut)", margin: "10px 0 0" }}>{file.name} · {fmt(file.size)} · {file.type || "unknown type"}</p>}</div>
    <label className="card" style={{ display: "flex", gap: 10, fontSize: 14 }}><input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} />I own this file or have permission to convert it.</label>
    <button className="btn" style={{ justifyContent: "center" }} onClick={convert} disabled={!file || !own || busy}>{busy ? "Converting…" : "Convert to MP3"}</button>
    {(busy || out) && <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>}
    {error && <p className="warn" role="alert">{error}</p>}
    {out && <div className="card"><h3>Done</h3><p style={{ margin: "0 0 10px", fontSize: 14 }}>{out.name} · {fmt(out.size)}</p><a className="btn" href={out.url} download={out.name}>⬇ Download MP3</a></div>}
    <p style={{ fontSize: 12, color: "var(--mut)" }}>Your file is converted in your browser and is never uploaded to our servers.</p>
  </div>);
}
