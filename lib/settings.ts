import { cache } from "react";
import { getSupabase } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
export const HOME_DEFAULTS = {
  brand_name: "MediaAura", tagline: "Download · Convert · Enjoy", logo_url: "", hero_badge: "⚡ Fast · Secure · Free Forever",
  hero_line1: "All-in-One", hero_line2: "Video", hero_highlight: "Downloader",
  hero_description: "Download videos from YouTube, Facebook, Instagram, TikTok and more — in just one click!",
  input_placeholder: "Paste your video link here…", button_label: "⬇ Download", trust1: "100% Safe", trust2: "Lightning Fast", trust3: "No Signup Required", hero_image_url: "",
  tools_pill: "★ Popular Tools", tools_title: "Choose Your Platform", tools_desc: "Select a tool below to download your favorite content",
  how_title: "How It Works?", how_desc: "Get your video in just 3 easy steps", why_title: "👑 Why Choose MediaAura?",
  why_items: "Super Fast Downloads\nSupports 12+ Platforms\nHD Quality\n100% Free & Secure\nNo Registration\nWorks on All Devices",
  articles_badge: "Latest Articles", articles_title: "Tips, Guides & Latest News", articles_desc: "Get helpful articles, tutorials and updates about video downloading and online tools.",
  show_how: true, show_why: true, show_articles: true,
  footer_description: "Your ultimate online platform for downloading and converting media. Fast, secure and always free!", copyright: "© 2026 MediaAura. All rights reserved.",
  social_facebook: "", social_youtube: "", social_x: "", social_instagram: "", social_linkedin: "", social_pinterest: "",
};
export type Home = typeof HOME_DEFAULTS;
export const SEO_DEFAULTS = {
  site_title: "MediaAura – All-in-One Video Downloader", meta_description: "Check links, convert video to MP3 and find official ways to save media. Fast, secure and free.",
  default_og_image: "", social_title: "", social_description: "", canonical_domain: "", robots_noindex: false,
  org_name: "", org_logo: "", org_email: "", social_profiles: "", ga_id: "", gsc_verification: "", other_verification: "",
};
export type SeoGlobal = typeof SEO_DEFAULTS;
export const GENERAL_DEFAULTS = { support_email: "", registration_enabled: false, contact_enabled: true, newsletter_enabled: true };
export type General = typeof GENERAL_DEFAULTS;
// Public settings (read with the anon key, cached per request). Missing or unreachable DB falls back to defaults.
export const getSetting = cache(async <T extends object>(key: string, defaults: T): Promise<T> => {
  const sb = getSupabase();
  if (!sb) return defaults;
  const { data } = await sb.from("site_settings").select("value").eq("key", key).maybeSingle();
  return { ...defaults, ...((data?.value as object) ?? {}) } as T;
});
// For API routes that must enforce a switch immediately (no caching).
export async function getGeneralFresh(): Promise<General> {
  try { const { data } = await createAdminClient().from("site_settings").select("value").eq("key", "general").maybeSingle(); return { ...GENERAL_DEFAULTS, ...((data?.value as object) ?? {}) }; }
  catch { return GENERAL_DEFAULTS; }
}
export const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
