import Header from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { getSetting, GENERAL_DEFAULTS } from "@/lib/settings";
export const revalidate = 60;
export const metadata = { title: "Contact – MediaAura", description: "Send a message to the MediaAura team." };
export default async function Contact() {
  const g = await getSetting("general", GENERAL_DEFAULTS);
  return (<><Header /><main className="wrap toolpage"><h1>Contact us</h1><p className="lead">Questions, feedback or copyright requests? Send us a message.{g.support_email && <> Or email <a href={`mailto:${g.support_email}`} style={{ textDecoration: "underline" }}>{g.support_email}</a>.</>}</p>
    {g.contact_enabled ? <ContactForm /> : <p>The contact form is currently unavailable.</p>}</main><Footer /></>);
}
