export const qs = (base: Record<string, string | undefined>, o: Record<string, string | undefined> = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...o })) if (v) p.set(k, v);
  const s = p.toString(); return s ? `?${s}` : "";
};
export const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
export const safeSearch = (s?: string) => (s ?? "").replace(/[^\p{L}\p{N}@.\-_ ]/gu, "").trim().slice(0, 60);
export const pageNum = (s?: string) => Math.max(1, parseInt(s ?? "1", 10) || 1);
