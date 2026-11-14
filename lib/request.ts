import { createHash } from "crypto";
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
// Anonymous, daily-rotating hash. Raw IPs are never stored.
export const visitorHash = (req: Request) =>
  createHash("sha256").update(`${clientIp(req)}|${req.headers.get("user-agent") ?? ""}|${new Date().toISOString().slice(0, 10)}|${process.env.HASH_SALT ?? ""}`).digest("hex").slice(0, 32);
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
