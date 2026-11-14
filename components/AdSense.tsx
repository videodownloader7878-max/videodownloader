"use client";
import { useEffect } from "react";
import Script from "next/script";
export default function AdSense({ client, slot }: { client: string; slot: string }) {
  useEffect(() => { try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch {} }, []);
  return (<>
    <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} crossOrigin="anonymous" strategy="afterInteractive" />
    <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
  </>);
}
