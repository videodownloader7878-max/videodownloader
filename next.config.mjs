// CSP is Report-Only first: open the site and check the browser console for violations, then rename the header to Content-Security-Policy.
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://pagead2.googlesyndication.com; frame-src https://challenges.cloudflare.com https://googleads.g.doubleclick.net https://*.googlesyndication.com; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
const headers = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];
export default { async headers() { return [{ source: "/:path*", headers }]; } };
