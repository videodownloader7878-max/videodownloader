import Header from "@/components/SiteHeader";
import HeroForm from "@/components/HeroForm";
import Footer from "@/components/Footer";
import ArticlesSection from "@/components/ArticlesSection";
import AdSlot from "@/components/AdSlot";
import { tools } from "@/lib/tools";
import { getSetting, HOME_DEFAULTS, lines } from "@/lib/settings";
export const revalidate = 60;
const orbit: { s: React.CSSProperties; bg: string; c: string }[] = [
  { s: { left: "8%", top: 30, animationDelay: "-1s" }, bg: "#f00", c: "▶" }, { s: { left: "38%", top: 0, animationDelay: "-2s" }, bg: "#1877f2", c: "f" },
  { s: { left: "64%", top: 18, animationDelay: "-3s" }, bg: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)", c: "◎" }, { s: { right: 0, top: 84, animationDelay: "-.5s" }, bg: "#111", c: "♪" },
  { s: { right: "2%", top: 170, animationDelay: "-2.5s" }, bg: "#111", c: "X" }, { s: { right: "4%", top: 248, animationDelay: "-1.5s" }, bg: "#e60023", c: "P" },
];
export default async function Home() {
  const h = await getSetting("home", HOME_DEFAULTS);
  const both = h.show_how && h.show_why;
  return (<>
    <Header />
    <main id="top" className="wrap">
      <section className="hero">
        <div>
          <span className="badge">{h.hero_badge}</span>
          <h1>{h.hero_line1}<br />{h.hero_line2} <span>{h.hero_highlight}</span></h1>
          <p className="lead">{h.hero_description}</p>
          <HeroForm placeholder={h.input_placeholder} label={h.button_label} />
          <div className="trust"><span><i>◆</i>{h.trust1}</span><span><i>⚡</i>{h.trust2}</span><span><i>✔</i>{h.trust3}</span></div>
        </div>
        {h.hero_image_url.startsWith("https://")
          // eslint-disable-next-line @next/next/no-img-element
          ? <div className="stage"><img src={h.hero_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
          : <div className="stage" aria-hidden="true">
              <div className="lap"><div className="play">▶</div></div><div className="cloud">⬇</div>
              {orbit.map((o, i) => <div key={i} className="ic" style={{ ...o.s, background: o.bg }}>{o.c}</div>)}
              <div className="tag">Download<br />Your Favorite Videos<br />Anytime, Anywhere!</div>
            </div>}
      </section>
      <section className="panel" id="tools" aria-labelledby="th">
        <span className="pill">{h.tools_pill}</span><h2 id="th">{h.tools_title}</h2><p className="sub">{h.tools_desc}</p>
        <div className="grid">{tools.map((t) => (<a key={t.slug} className="tool" href={`/${t.slug}`}><span className="ic" style={{ background: t.bg }}>{t.glyph}</span><span>{t.name}</span><em>›</em></a>))}</div>
      </section>
      <AdSlot placement="homepage" />
      {(h.show_how || h.show_why) && <section className="lower" id="about" style={both ? undefined : { gridTemplateColumns: "1fr" }}>
        {h.show_how && <div className="how"><h2>{h.how_title}</h2><p className="sub">{h.how_desc}</p>
          <div className="steps">
            <div className="step"><b>1</b><div><span>🔗</span>Paste the<br />Video Link</div></div><span aria-hidden="true">→</span>
            <div className="step"><b>2</b><div><span>⬇</span>Click<br />Download</div></div><span aria-hidden="true">→</span>
            <div className="step"><b>3</b><div><span>✔</span>Enjoy<br />Your File</div></div>
          </div></div>}
        {h.show_why && <div className="why"><h3>{h.why_title}</h3><ul>{lines(h.why_items).map((x) => <li key={x}>{x}</li>)}</ul></div>}
      </section>}
      {h.show_articles && <ArticlesSection badge={h.articles_badge} title={h.articles_title} desc={h.articles_desc} />}
    </main>
    <Footer />
  </>);
}
