// One-off: node --env-file=.env.local scripts/create-admin.mjs
// Creates the FIRST super_admin. Refuses to run if one already exists. Credentials come from env only.
import { createClient } from "@supabase/supabase-js";
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, ADMIN_EMAIL: email, ADMIN_PASSWORD: pw } = process.env;
if (!url || !key || !email || !pw) { console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL and ADMIN_PASSWORD."); process.exit(1); }
if (pw.length < 12) { console.error("ADMIN_PASSWORD must be at least 12 characters."); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { count, error: e0 } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
if (e0) { console.error("Could not check existing admins (did you run the migrations?):", e0.message); process.exit(1); }
if (count > 0) { console.error("A super_admin already exists. Aborting."); process.exit(1); }
const { data, error } = await sb.auth.admin.createUser({ email, password: pw, email_confirm: true });
if (error) { console.error("Create user failed:", error.message); process.exit(1); }
const { error: e2 } = await sb.from("profiles").update({ role: "super_admin" }).eq("id", data.user.id);
if (e2) { console.error("Role update failed:", e2.message); process.exit(1); }
console.log(`Super admin created: ${email}\nNow delete ADMIN_PASSWORD from .env.local.`);
