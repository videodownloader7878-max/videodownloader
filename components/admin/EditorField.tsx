"use client";
import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/media";
export type LinkTarget = { title: string; href: string };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
// Lightweight rich text editor (contentEditable + execCommand). Content is sanitized again on the server when saved.
export default function EditorField({ name = "content", initialHtml, onChange, media = [], links = [] }: { name?: string; initialHtml: string; onChange?: (h: string) => void; media?: MediaItem[]; links?: LinkTarget[] }) {
  const ref = useRef<HTMLDivElement>(null); const saved = useRef<Range | null>(null);
  const [html, setHtml] = useState(initialHtml); const [preview, setPreview] = useState(false);
  useEffect(() => { if (ref.current) ref.current.innerHTML = initialHtml; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const sync = () => { const h = ref.current?.innerHTML ?? ""; setHtml(h); onChange?.(h); };
  const keep = () => { const s = window.getSelection(); if (s?.rangeCount && ref.current?.contains(s.anchorNode)) saved.current = s.getRangeAt(0).cloneRange(); };
  const run = (c: string, v?: string) => {
    ref.current?.focus();
    const s = window.getSelection(); if (saved.current && s) { s.removeAllRanges(); s.addRange(saved.current); }
    document.execCommand(c, false, v); sync(); keep();
  };
  const hasSel = () => !!saved.current && !saved.current.collapsed;
  const link = () => { const u = prompt("Link URL (https://… or /page)"); if (u && /^(https:\/\/|http:\/\/|\/(?!\/)|mailto:)/.test(u)) run("createLink", u); };
  const internal = (href: string) => { if (!href) return; const t = links.find((l) => l.href === href); hasSel() ? run("createLink", href) : run("insertHTML", `<a href="${esc(href)}">${esc(t?.title ?? href)}</a>`); };
  const image = (id: string) => { const m = media.find((x) => x.id === id); if (m) run("insertHTML", `<img src="${esc(m.url)}" alt="${esc(m.alt || m.title)}">`); };
  const table = () => { const [r, c] = (prompt("Rows,Columns", "3,3") ?? "").split(",").map((n) => Math.min(20, parseInt(n, 10) || 0)); if (!r || !c) return;
    run("insertHTML", `<table><tbody>${Array.from({ length: r }, (_, i) => `<tr>${Array.from({ length: c }, () => (i === 0 ? "<th>&nbsp;</th>" : "<td>&nbsp;</td>")).join("")}</tr>`).join("")}</tbody></table><p></p>`); };
  const md = (e: React.MouseEvent) => e.preventDefault(); // keep editor selection when clicking toolbar buttons
  return (<div>
    <div className="edtool" role="toolbar" aria-label="Editor toolbar">
      <select aria-label="Block type" defaultValue="" onChange={(e) => { if (e.target.value) run("formatBlock", `<${e.target.value}>`); e.target.value = ""; }}><option value="">Format…</option><option value="p">Paragraph</option>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={`h${n}`}>Heading {n}</option>)}<option value="blockquote">Quote</option></select>
      <button type="button" onMouseDown={md} onClick={() => run("bold")}><b>B</b></button><button type="button" onMouseDown={md} onClick={() => run("italic")}><i>I</i></button>
      <button type="button" onMouseDown={md} onClick={() => run("insertUnorderedList")}>• List</button><button type="button" onMouseDown={md} onClick={() => run("insertOrderedList")}>1. List</button>
      <button type="button" onMouseDown={md} onClick={link}>Link</button><button type="button" onMouseDown={md} onClick={table}>Table</button>
      <button type="button" onMouseDown={md} onClick={() => run("removeFormat")}>Clear</button>
      {links.length > 0 && <select aria-label="Internal link" defaultValue="" onChange={(e) => { internal(e.target.value); e.target.value = ""; }}><option value="">Internal link…</option>{links.map((l) => <option key={l.href} value={l.href}>{l.title}</option>)}</select>}
      {media.length > 0 && <select aria-label="Insert image" defaultValue="" onChange={(e) => { image(e.target.value); e.target.value = ""; }}><option value="">Image…</option>{media.map((m) => <option key={m.id} value={m.id}>{m.title || m.alt || m.url.split("/").pop()}</option>)}</select>}
      <button type="button" onClick={() => setPreview(!preview)}>{preview ? "Edit" : "Preview"}</button>
    </div>
    <div ref={ref} className="edarea" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Content" style={{ display: preview ? "none" : "block" }}
      onInput={sync} onKeyUp={keep} onMouseUp={keep} onBlur={keep}
      onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }} />
    {preview && <iframe sandbox="" title="Preview" style={{ width: "100%", height: 420, border: "1px solid #e3e7f3", borderRadius: "0 0 10px 10px", background: "#fff" }}
      srcDoc={`<style>body{font:16px/1.7 system-ui,sans-serif;max-width:720px;margin:16px auto;padding:0 16px;color:#12183f}img{max-width:100%}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px}blockquote{border-left:3px solid #6d7dff;margin:12px 0;padding-left:12px;color:#555}</style>${html}`} />}
    <input type="hidden" name={name} value={html} />
  </div>);
}
