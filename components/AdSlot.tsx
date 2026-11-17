import Script from "next/script";
import { getSupabase } from "@/lib/supabase";
import AdSense from "@/components/AdSense";
// Renders nothing unless the admin enabled this placement (RLS only exposes enabled rows) and its config is valid.
export default async function AdSlot({ placement }: { placement: "homepage" | "tool_page" | "blog" | "sidebar" | "footer" }) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("ad_settings").select("provider,config").eq("placement", placement).maybeSingle();
  if (!data) return null;
  const c = (data.config ?? {}) as Record<string, string>;
  const allowed = (process.env.ADS_ALLOWED_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  let body: React.ReactNode = null;
  if (data.provider === "adsense" && /^ca-pub-\d{10,20}$/.test(c.adsense_client ?? "") && /^\d{5,20}$/.test(c.adsense_slot ?? "")) body = <AdSense client={c.adsense_client} slot={c.adsense_slot} />;
  else if (data.provider === "custom" && c.script_src) { try { const u = new URL(c.script_src); if (u.protocol === "https:" && allowed.includes(u.hostname)) body = <Script async src={u.href} strategy="afterInteractive" />; } catch {} }
  if (!body) return null;
  return <aside className="ad-wrap" aria-label="Advertisement"><small>Advertisement</small>{body}</aside>;
}
