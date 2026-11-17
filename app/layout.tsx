import type { Metadata } from "next";
import Script from "next/script";
import { Poppins } from "next/font/google";
import "./globals.css";
import Tracker from "@/components/Tracker";
import { getSetting, SEO_DEFAULTS, lines } from "@/lib/settings";
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "800"], style: ["normal", "italic"], variable: "--font-poppins" });
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSetting("seo", SEO_DEFAULTS);
  let metadataBase: URL | undefined;
  try { metadataBase = new URL(s.canonical_domain || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"); } catch {}
  const other: Record<string, string> = {};
  lines(s.other_verification).forEach((l) => { const i = l.indexOf("="); const k = l.slice(0, i).trim(), v = l.slice(i + 1).trim(); if (i > 0 && /^[\w:.-]{1,60}$/.test(k) && v && v.length < 200) other[k] = v; });
  return {
    metadataBase, title: { default: s.site_title, template: "%s" }, description: s.meta_description,
    robots: s.robots_noindex ? { index: false, follow: false } : undefined,
    openGraph: { title: s.social_title || s.site_title, description: s.social_description || s.meta_description, images: s.default_og_image ? [s.default_og_image] : undefined },
    verification: { google: s.gsc_verification || undefined, other: Object.keys(other).length ? other : undefined },
  };
}
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSetting("seo", SEO_DEFAULTS);
  const ga = /^G-[A-Z0-9]{4,14}$/.test(s.ga_id) ? s.ga_id : null;
  const org = s.org_name ? { "@context": "https://schema.org", "@type": "Organization", name: s.org_name, logo: s.org_logo || undefined, email: s.org_email || undefined, sameAs: lines(s.social_profiles).filter((u) => u.startsWith("https://")) } : null;
  return (
    <html lang="en" data-theme="dark" className={poppins.variable}>
      <body><Tracker />{children}
        {org && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />}
        {ga && <><Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" /><Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');`}</Script></>}
      </body>
    </html>
  );
}
