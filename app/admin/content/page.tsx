import { requireRole } from "@/lib/auth";
import { Flash } from "@/components/admin/ui";
import { getSetting, HOME_DEFAULTS } from "@/lib/settings";
import { saveHome } from "../actions2";
const groups: { title: string; fields: [keyof typeof HOME_DEFAULTS, string, ("area" | "url")?][] }[] = [
  { title: "Brand", fields: [["brand_name", "Brand name"], ["tagline", "Tagline"], ["logo_url", "Website logo URL (https)", "url"]] },
  { title: "Hero", fields: [["hero_badge", "Hero badge"], ["hero_line1", "Heading line 1"], ["hero_line2", "Heading line 2"], ["hero_highlight", "Highlighted word"], ["hero_description", "Hero description", "area"], ["input_placeholder", "Input placeholder"], ["button_label", "Button label"], ["trust1", "Trust indicator 1"], ["trust2", "Trust indicator 2"], ["trust3", "Trust indicator 3"], ["hero_image_url", "Hero illustration URL (https, replaces the built-in artwork)", "url"]] },
  { title: "Tools section", fields: [["tools_pill", "Pill label"], ["tools_title", "Heading"], ["tools_desc", "Description"]] },
  { title: "How It Works", fields: [["how_title", "Heading"], ["how_desc", "Description"]] },
  { title: "Why Choose Us", fields: [["why_title", "Heading"], ["why_items", "Items (one per line)", "area"]] },
  { title: "Articles section", fields: [["articles_badge", "Badge"], ["articles_title", "Heading"], ["articles_desc", "Description", "area"]] },
  { title: "Footer", fields: [["footer_description", "Footer description", "area"], ["copyright", "Copyright text"], ["social_facebook", "Facebook URL", "url"], ["social_youtube", "YouTube URL", "url"], ["social_x", "X URL", "url"], ["social_instagram", "Instagram URL", "url"], ["social_linkedin", "LinkedIn URL", "url"], ["social_pinterest", "Pinterest URL", "url"]] },
];
export default async function Content({ searchParams: sp }: { searchParams: { error?: string; ok?: string } }) {
  await requireRole("editor");
  const h = await getSetting("home", HOME_DEFAULTS);
  return (<><h1>Content Management</h1><p className="a-muted">Edit the homepage and footer. Featured articles are chosen in Blog Management. Changes appear within a minute.</p><Flash error={sp.error} ok={sp.ok} />
    <form action={saveHome} className="a-form">
      {groups.map((g) => <div key={g.title} className="a-card a-form"><h3>{g.title}</h3>{g.fields.map(([k, l, t]) => t === "area"
        ? <label key={k}>{l}<textarea name={k} rows={3} defaultValue={String(h[k])} /></label>
        : <label key={k}>{l}<input type={t === "url" ? "url" : "text"} name={k} defaultValue={String(h[k])} placeholder={t === "url" ? "https://" : undefined} /></label>)}</div>)}
      <div className="a-card a-form"><h3>Show sections</h3>
        <label className="chk"><input type="checkbox" name="show_how" defaultChecked={h.show_how} />How It Works</label>
        <label className="chk"><input type="checkbox" name="show_why" defaultChecked={h.show_why} />Why Choose Us</label>
        <label className="chk"><input type="checkbox" name="show_articles" defaultChecked={h.show_articles} />Latest articles</label></div>
      <div><button className="a-btn p">Save homepage</button></div>
    </form></>);
}
