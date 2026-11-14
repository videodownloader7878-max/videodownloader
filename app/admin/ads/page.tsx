import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/admin/ui";
import { saveAd } from "../actions2";
const P: [string, string][] = [["homepage", "Homepage"], ["tool_page", "Tool pages"], ["blog", "Blog articles"], ["sidebar", "Sidebar (article pages)"], ["footer", "Footer"]];
export default async function Ads({ searchParams: sp }: { searchParams: { error?: string; ok?: string } }) {
  await requireRole("admin");
  const { data } = await createClient().from("ad_settings").select("*");
  const by = new Map((data ?? []).map((a) => [a.placement, a]));
  return (<><h1>Advertisement Management</h1><Flash error={sp.error} ok={sp.ok} />
    <p className="a-muted">Ads are shown in a separate, labelled box away from tool controls. Only AdSense (public client and slot IDs) and script URLs from hosts listed in the ADS_ALLOWED_HOSTS environment variable are supported. Nothing is saved as a secret here.</p>
    <div className="a-grid2">{P.map(([k, l]) => { const a = by.get(k); const c = (a?.config ?? {}) as Record<string, string>; return (
      <form key={k} action={saveAd.bind(null, k)} className="a-card a-form"><h3>{l}</h3>
        <label className="chk"><input type="checkbox" name="is_enabled" defaultChecked={a?.is_enabled ?? false} />Enabled</label>
        <label>Provider<select name="provider" defaultValue={a?.provider ?? "none"}><option value="none">None</option><option value="adsense">Google AdSense</option><option value="custom">Alternative network (script URL)</option></select></label>
        <label>AdSense client ID (ca-pub-…)<input type="text" name="adsense_client" defaultValue={c.adsense_client ?? ""} /></label>
        <label>AdSense slot ID<input type="text" name="adsense_slot" defaultValue={c.adsense_slot ?? ""} /></label>
        <label>Alternative script URL (https)<input type="url" name="script_src" defaultValue={c.script_src ?? ""} placeholder="https://" /></label>
        <div><button className="a-btn p">Save</button></div></form>); })}</div></>);
}
