import Link from "next/link";
export function Flash({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return <p role={error ? "alert" : "status"} className={error ? "a-flash a-err" : "a-flash a-ok"}>{error ?? ok}</p>;
}
export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return <div className="a-pager">{page > 1 ? <Link className="a-btn" href={href(page - 1)}>← Previous</Link> : <span />}<span>Page {page} of {pages}</span>{page < pages ? <Link className="a-btn" href={href(page + 1)}>Next →</Link> : <span />}</div>;
}
export function BarChart({ data, title }: { data: { label: string; value: number }[]; title: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 600, h = 140, bw = data.length ? w / data.length : w;
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="a-card"><h3>{title}</h3>
      {total === 0 ? <p className="a-muted">No data yet.</p> : (
        <svg viewBox={`0 0 ${w} ${h + 20}`} role="img" aria-label={title} style={{ width: "100%", height: "auto" }}>
          {data.map((d, i) => { const bh = (d.value / max) * h; return (<g key={i}>
            <rect x={i * bw + bw * 0.15} y={h - bh} width={bw * 0.7} height={Math.max(bh, d.value ? 2 : 0)} rx="2" fill="#5b6cff"><title>{`${d.label}: ${d.value}`}</title></rect>
            {(data.length <= 12 || i % Math.ceil(data.length / 10) === 0) && <text x={i * bw + bw / 2} y={h + 14} fontSize="10" textAnchor="middle" fill="#6b7280">{d.label}</text>}</g>); })}
        </svg>)}
    </div>
  );
}
export function TopList({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  return <div className="a-card"><h3>{title}</h3>{rows.length === 0 ? <p className="a-muted">No data yet.</p> : <ol className="a-list">{rows.map((r) => <li key={r.label}><span>{r.label}</span><b>{r.value}</b></li>)}</ol>}</div>;
}
