"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
export default function Unsubscribe() {
  const [token, setToken] = useState(""); const [done, setDone] = useState(false);
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get("token") ?? ""); }, []);
  async function go() { await fetch("/api/newsletter/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }); setDone(true); }
  return (<><Header /><main className="wrap toolpage"><h1>Unsubscribe</h1>
    {done ? <p>You’re unsubscribed. You won’t get more emails from us.</p> : token ? <><p className="lead">Confirm that you want to stop receiving emails.</p><button className="btn" onClick={go}>Unsubscribe</button></> : <p>This unsubscribe link is missing its token. Use the link from the email.</p>}
  </main></>);
}
