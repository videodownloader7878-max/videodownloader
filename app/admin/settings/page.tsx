import { requireRole } from "@/lib/auth";
import { Flash } from "@/components/admin/ui";
import { getSetting, GENERAL_DEFAULTS } from "@/lib/settings";
import { saveGeneral } from "../actions2";
export default async function Settings({ searchParams: sp }: { searchParams: { error?: string; ok?: string } }) {
  await requireRole("admin");
  const g = await getSetting("general", GENERAL_DEFAULTS);
  return (<><h1>Site Settings</h1><Flash error={sp.error} ok={sp.ok} />
    <form action={saveGeneral} className="a-form a-card"><h3>General</h3>
      <label>Support email (shown on the Contact page)<input type="text" name="support_email" defaultValue={g.support_email} /></label>
      <label className="chk"><input type="checkbox" name="contact_enabled" defaultChecked={g.contact_enabled} />Contact form enabled</label>
      <label className="chk"><input type="checkbox" name="newsletter_enabled" defaultChecked={g.newsletter_enabled} />Newsletter signup enabled</label>
      <label className="chk"><input type="checkbox" name="registration_enabled" defaultChecked={g.registration_enabled} />Public account registration (/signup)</label>
      <p className="a-muted">New accounts are always normal users. This switch controls the /signup page of this site. To block sign-ups completely, also turn off “Allow new users to sign up” in Supabase Authentication settings, because that API is separate.</p>
      <div><button className="a-btn p">Save settings</button></div></form></>);
}
