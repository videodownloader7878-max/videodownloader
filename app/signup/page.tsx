import Header from "@/components/SiteHeader";
import SignUpForm from "@/components/SignUpForm";
import { getSetting, GENERAL_DEFAULTS } from "@/lib/settings";
export const revalidate = 60;
export const metadata = { title: "Create account – MediaAura", robots: { index: false } };
export default async function SignUp() {
  const g = await getSetting("general", GENERAL_DEFAULTS);
  return (<><Header /><main className="wrap toolpage" style={{ maxWidth: 420 }}><h1>Create account</h1>
    {g.registration_enabled ? <SignUpForm /> : <p className="lead">Account registration is currently closed.</p>}</main></>);
}
