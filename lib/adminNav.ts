import type { Role } from "@/lib/auth";
export type NavItem = { href: string; label: string; min: Role; built: boolean };
export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", min: "editor", built: true },
  { href: "/admin/content", label: "Content Management", min: "editor", built: true },
  { href: "/admin/blog", label: "Blog Management", min: "editor", built: true },
  { href: "/admin/seo", label: "SEO Management", min: "editor", built: true },
  { href: "/admin/tools", label: "Tools Management", min: "admin", built: true },
  { href: "/admin/users", label: "Users Management", min: "admin", built: true },
  { href: "/admin/messages", label: "Messages / Inquiries", min: "admin", built: true },
  { href: "/admin/analytics", label: "Analytics", min: "admin", built: true },
  { href: "/admin/ads", label: "Advertisement Management", min: "admin", built: true },
  { href: "/admin/newsletter", label: "Newsletter Management", min: "admin", built: true },
  { href: "/admin/media", label: "Media Library", min: "editor", built: true },
  { href: "/admin/pages", label: "Pages Management", min: "editor", built: true },
  { href: "/admin/roles", label: "Roles & Permissions", min: "super_admin", built: true },
  { href: "/admin/settings", label: "Site Settings", min: "admin", built: true },
  { href: "/admin/logs", label: "Security & Activity Logs", min: "admin", built: true },
  { href: "/admin/profile", label: "Admin Profile", min: "editor", built: true },
];
