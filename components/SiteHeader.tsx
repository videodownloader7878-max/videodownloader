import Header from "@/components/Header";
import { getSetting, HOME_DEFAULTS } from "@/lib/settings";
export default async function SiteHeader() {
  const h = await getSetting("home", HOME_DEFAULTS);
  return <Header brandName={h.brand_name} tagline={h.tagline} logoUrl={h.logo_url} />;
}
