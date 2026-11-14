"use client";
import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/media";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
type Target = { label: string; href: string };
// Content is sanitised on the server when saved and again when rendered publicly. Paste is forced to plain text,
// and the preview runs in a sandboxed iframe (no scripts).
export default function RichEditor({ name = "content", initialHtml = "", media = [], linkTargets = [], onChange }: { name?: string; initialHtml?: string; media?: MediaItem[]; linkTargets?: Target[]; onChange?: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(initialHtml); const [preview, setPreview] = useState(false);
  useEffect(() => { if (ref.current) ref.current.innerHTML = initialHtml; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const sync = () => { const h = ref.current?.innerHTML ?? ""; setHtml(h); onChange?.(h); };
  const cmd = (c: string, v?: string) => { ref.current?.focus(); document.execCommand(c, false, v); sync(); };
  const keep = (e: React.MouseEvent) => e.preventDefault();
  const B = ({ c, v, children, title }: { c: string; v?: string; children: React.ReactNode; title: string }) => <button type="button" title={title} aria-label={title} onMouseDown={keep} onClick={() => cmd(c, v)}>{children}</button>;
  function link() { const u = prompt("Link URL (https://… or /page)"); if (u && /^(https?:\/\/|\/(?!\/)|mailto:)/.test(u.trim())) cmd("createLink", u.trim()); }
  function internal(href: string) {
    if (!href) return;
    const t = linkTargets.find((x) => x.href === href);
    if (window.getSelection()?.isCollapsed) cmd("insertHTML", `<a href="${esc(href)}">${esc(t?.label ?? href)}</a>`); else cmd("createLink", href);
  }
  function image(id: string) { const m = media.find((x) => x.id === id); if (m) cmd("insertHTML", `<img src="${esc(m.url)}" alt="${esc(m.alt)}">`); }
  function table() {
    const r = Math.min(10, Math.max(1, parseInt(prompt("Rows", "3") ?? "", 10) || 0)), c = Math.min(8, Math.max(1, parseInt(prompt("Columns", "3") ?? "", 10) || 0));
    if (!r || !c) return;
    const row = (t: string) => `<tr>${Array.from({ length: c }, () => `<${t}>&nbsp;</${t}>`).join("")}</tr>`;
    cmd("insertHTML", `<table><thead>${row("th")}</thead><tbody>${Array.from({ length: r - 1 }, () => row("td")).join("")}</tbody></table><p></p>`);
  }
  const doc = `<style>body{font:16px/1.7 system-ui,sans-serif;max-width:720px;margin:16px auto;padding:0 16px}img{max-width:100%}td,th{border:1px solid #ccc;padding:6px}table{border-collapse:collapse}blockquote{border-left:3px solid #6d7dff;margin:12px 0;padding-left:12px;color:#555}</style>${html}`;
  return (<div>
    <div className="edtool" role="toolbar" aria-label="Formatting">
      <select aria-label="Block type" defaultValue="" onChange={(e) => { if (e.target.value) cmd("formatBlock", `<${e.target.value}>`); e.target.value = ""; }}>
        <option value="">Format…</option><option value="p">Paragraph</option>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={`h${n}`}>Heading {n}</option>)}<option value="blockquote">Quote</option></select>
      <B c="bold" title="Bold"><b>B</b></B><B c="italic" title="Italic"><i>I</i></B><B c="insertUnorderedList" title="Bullet list">• List</B><B c="insertOrderedList" title="Numbered list">1. List</B>
      <button type="button" onMouseDown={keep} onClick={link}>Link</button><B c="unlink" title="Remove link">Unlink</B>
      {linkTargets.length > 0 && <select aria-label="Insert internal link" defaultValue="" onChange={(e) => { internal(e.target.value); e.target.value = ""; }}><option value="">Internal link…</option>{linkTargets.map((t) => <option key={t.href} value={t.href}>{t.label}</option>)}</select>}
      {media.length > 0 && <select aria-label="Insert image" defaultValue="" onChange={(e) => { image(e.target.value); e.target.value = ""; }}><option value="">Image…</option>{media.map((m) => <option key={m.id} value={m.id}>{m.title || m.alt || m.url.split("/").pop()}</option>)}</select>}
      <button type="button" onMouseDown={keep} onClick={table}>Table</button>
      <button type="button" onClick={() => setPreview(!preview)}>{preview ? "Edit" : "Preview"}</button>
    </div>
    <div ref={ref} className="edarea" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Content" style={preview ? { display: "none" } : undefined}
      onInput={sync} onBlur={sync} onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }} />
    {preview && <iframe title="Preview" sandbox="" srcDoc={doc} style={{ width: "100%", minHeight: 320, border: "1px solid #e3e7f3", borderRadius: "0 0 10px 10px", background: "#fff" }} />}
    <input type="hidden" name={name} value={html} />
    {media.length === 0 && <p className="a-muted" style={{ marginTop: 6 }}>Upload images in the Media Library to insert them here.</p>}
  </div>);
}
