"use client";
export default function SignOutButton() {
  return <button className="a-nav" style={{ background: "none", border: 0, cursor: "pointer", textAlign: "left", width: "100%" }} onClick={async () => { await fetch("/api/auth/signout", { method: "POST" }); window.location.href = "/"; }}>Logout</button>;
}
