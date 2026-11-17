import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/admin/ui";
import { fmtDate } from "@/lib/adminUi";
import { setMessageStatus, saveMessageNotes, deleteMessage } from "../../actions";
import { sendReply } from "../../actions2";
export default async function Message({ params, searchParams: sp }: { params: { id: string }; searchParams: { error?: string; ok?: string } }) {
  await requireRole("admin");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const { data: m } = await createClient().from("contact_messages").select("*").eq("id", params.id).maybeSingle();
  if (!m) notFound();
  return (<><p><Link href="/admin/messages">← All messages</Link></p><h1>{m.subject}</h1><Flash error={sp.error} ok={sp.ok} />
    <div className="a-card" style={{ marginBottom: 14 }}>
      <p className="a-muted">From <b>{m.name}</b> · {m.email} · {fmtDate(m.created_at)} · <span className="a-tag">{m.status}</span></p>
      <p style={{ whiteSpace: "pre-wrap" }}>{m.message}</p>
      <div className="a-inline" style={{ flexWrap: "wrap" }}>
        <a className="a-btn p" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject)}`}>Reply by email</a>
        {["read", "unread", "replied", "archived"].filter((x) => x !== m.status).map((x) => <form key={x} action={setMessageStatus.bind(null, m.id, x)}><button className="a-btn">Mark {x}</button></form>)}
      </div>
      {process.env.RESEND_API_KEY && process.env.RESEND_FROM
        ? <form action={sendReply.bind(null, m.id)} className="a-form" style={{ marginTop: 12 }}><h3>Send reply</h3><input type="text" name="subject" defaultValue={"Re: " + m.subject} maxLength={150} aria-label="Subject" /><textarea name="body" rows={5} maxLength={5000} required aria-label="Reply" /><div><button className="a-btn p">Send reply</button></div></form>
        : <p className="a-muted" style={{ marginTop: 10 }}>Reply opens your email app. Set RESEND_API_KEY and RESEND_FROM to send replies from here.</p>}
    </div>
    <div className="a-card" style={{ marginBottom: 14 }}><h3>Internal notes</h3>
      <form action={saveMessageNotes.bind(null, m.id)} className="a-form"><textarea name="notes" rows={4} maxLength={2000} defaultValue={m.admin_notes ?? ""} aria-label="Internal notes" /><div><button className="a-btn p">Save notes</button></div></form></div>
    <details className="a-card"><summary>Delete message</summary><p>This permanently removes the message.</p><form action={deleteMessage.bind(null, m.id)}><button className="a-btn d">Delete permanently</button></form></details></>);
}
