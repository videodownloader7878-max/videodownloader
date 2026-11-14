import NewsletterForm from "@/components/NewsletterForm";
import AdSlot from "@/components/AdSlot";
import { tools } from "@/lib/tools";
import { getSetting, HOME_DEFAULTS } from "@/lib/settings";
export default async function Footer() {
  const h = await getSetting("home", HOME_DEFAULTS);
  const socials: [string, string, string][] = [["Facebook", "f", h.social_facebook], ["YouTube", "▶", h.social_youtube], ["X", "X", h.social_x], ["Instagram", "◎", h.social_instagram], ["LinkedIn", "in", h.social_linkedin], ["Pinterest", "P", h.social_pinterest]];
  return (
    <footer id="contact">
      <div className="wrap"><AdSlot placement="footer" /></div>
      <svg className="wave" viewBox="0 0 1200 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40C200 0 350 70 600 40S1000 0 1200 35V0H0Z" fill="#070b24" /><path d="M0 50C250 20 400 70 650 45S1050 15 1200 45" fill="none" stroke="#6d5bff" strokeWidth="2" opacity=".8" /></svg>
      <div className="wrap">
        <div className="fcols">
          <div><a className="brand" href="/"><span className="logo">▶</span><span>{h.brand_name}<small>{h.tagline}</small></span></a><p>{h.footer_description}</p>
            <div className="soc">{socials.filter(([, , u]) => u.startsWith("https://")).map(([n, g, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" aria-label={n}>{g}</a>)}</div></div>
          <div><h4>Quick Links</h4><ul><li><a href="/">Home</a></li><li><a href="/#tools">All Tools</a></li><li><a href="/blog">Blog</a></li><li><a href="/about">About</a></li><li><a href="/contact">Contact</a></li></ul></div>
          <div><h4>Tools</h4><ul>{tools.slice(0, 4).map((t) => <li key={t.slug}><a href={`/${t.slug}`}>{t.name}</a></li>)}<li><a href="/#tools">+ 8 More Tools</a></li></ul></div>
          <div><h4>Legal</h4><ul><li><a href="/privacy-policy">Privacy Policy</a></li><li><a href="/terms">Terms &amp; Conditions</a></li><li><a href="/copyright-policy">Copyright Policy</a></li><li><a href="/dmca">DMCA Policy</a></li><li><a href="/sitemap.xml">Sitemap</a></li></ul></div>
          <div><h4>Newsletter</h4><p>Get the latest updates and tech tips in your inbox.</p><NewsletterForm /></div>
        </div>
        <div className="copy"><span>{h.copyright}</span><span>Made with ♥ for a better internet</span></div>
      </div>
    </footer>
  );
}
