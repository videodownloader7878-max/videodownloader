import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/admin/ui";
import PasswordForm from "@/components/admin/PasswordForm";
import { fmtDate } from "@/lib/adminUi";
import { saveProfileName } from "../actions2";
export default async function Profile({ searchParams: sp }: { searchParams: { error?: string; ok?: string } }) {
  const me = await requireRole("editor");
  const { data: p } = await createClient().from("profiles").select("last_login_at,created_at").eq("id", me.id).maybeSingle();
  return (<><h1>Admin Profile</h1><Flash error={sp.error} ok={sp.ok} />
    <div className="a-grid2"><div className="a-card a-form"><h3>Account</h3><p className="a-muted">{me.email} · {me.role}<br />Member since {fmtDate(p?.created_at ?? null)} · Last login {fmtDate(p?.last_login_at ?? null)}</p>
      <form action={saveProfileName} className="a-form"><label>Display name<input type="text" name="full_name" defaultValue={me.full_name ?? ""} maxLength={100} /></label><div><button className="a-btn p">Save name</button></div></form></div>
      <PasswordForm /></div></>);
}
