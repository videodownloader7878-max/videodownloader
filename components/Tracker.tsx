"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
function send(body: object) {
  if (navigator.doNotTrack === "1") return; // respect Do Not Track
  try { fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {}); } catch {}
}
export default function Tracker() {
  const p = usePathname();
  useEffect(() => { if (!p.startsWith("/admin")) send({ type: "page_view", path: p }); }, [p]);
  return null;
}
export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => { send({ type: "article_view", postId, path: window.location.pathname }); }, [postId]);
  return null;
}
