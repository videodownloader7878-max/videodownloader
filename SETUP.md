# MediaAura setup (Phase 1: database, auth, roles)

1. Create a Supabase project. Copy the project URL, anon key and service-role key.
2. In the SQL editor run, in order: `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_seed_storage.sql`
   (or use `supabase db push` with the Supabase CLI).
3. `cp .env.example .env.local`, fill in the three Supabase values plus ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters).
4. `npm install`, then `npm run create-admin`. It creates the first super_admin and refuses to run again if one exists.
5. Delete ADMIN_EMAIL / ADMIN_PASSWORD from `.env.local`. Run `npm run dev` and sign in at `/signin`.
6. Deploy on Vercel: add the same env vars in project settings. SUPABASE_SERVICE_ROLE_KEY must NOT be exposed to the browser.

## How access works
- New sign-ups are always `user`. Role is read from `profiles` in the database, never from the browser or user metadata.
- `/admin` is gated in middleware (logged in?) and in `app/admin/layout.tsx` (role check on the server). Every API route must call `authorize("admin")` or similar.
- A database trigger stops users changing their own role/status; only admins change roles, and only super_admin can touch admin roles.
- Contact messages, newsletter signups and usage events have no public INSERT policy: they are written by server routes (next phases).
- Self-registration UI is not included. Add it only if you want public user accounts.

## RLS checks to run yourself (not yet run)
- Anonymous: cannot read `contact_messages`, `profiles`, `activity_logs`; can read only published posts and enabled tools.
- Normal user: `update profiles set role='admin' where id = auth.uid()` must fail; /admin redirects to `/`.
- Editor: can create/edit posts and pages; cannot read `contact_messages` or change roles.
- Admin: cannot make anyone `admin`/`super_admin`; cannot change their own role.

## Tool pages (Phase 2b)
- All 12 pages are served by `app/[tool]/page.tsx` (`/youtube-downloader` … `/video-to-mp3`). Content, SEO and enabled state come from the `tools` and `seo_settings` tables.
- Platform downloaders validate the link and explain what the platform officially allows. They do NOT download files. Metadata preview (title, author, thumbnail) runs only for platforms with a public oEmbed endpoint AND only after the tool is marked verified:
  `update public.tools set integration_status = 'verified' where slug = 'youtube-downloader';` (do this after testing; the admin Tools module will replace this).
- Rate limiting is in-memory per server instance. Use Upstash/Redis for a shared limit in production.
- Video to MP3 runs fully in the browser with FFmpeg.wasm (`postinstall` copies the core into `public/ffmpeg`). Limit: 300 MB. Set `HASH_SALT` to any random string for anonymous usage stats.
- Review the "official alternatives" wording in `lib/adapters.ts` before launch; platform menus change.

## Public pages (Phase 2c)
- Run `supabase/migrations/0004_pages.sql`. It seeds About, Privacy, Terms, Copyright and DMCA as **drafts**: write your real text and set `status = 'published'` (the admin Pages module will do this later). I am not a lawyer; have the legal pages reviewed.
- `/blog`, `/blog/[slug]` (published posts only, HTML sanitized, Article + FAQ structured data), `/contact`, `/sitemap.xml`, `/robots.txt`, `/unsubscribe`. Set `NEXT_PUBLIC_SITE_URL` to your real domain.
- Contact form spam protection: hidden honeypot field, minimum fill time, rate limit (3 per 10 minutes per IP, in-memory). For stronger protection add Cloudflare Turnstile.
- Newsletter uses single opt-in with an explicit consent checkbox and a stored consent time. Sending emails and double opt-in need an email provider (not included), so the unsubscribe link will be added to emails later: `/unsubscribe?token=<unsubscribe_token>`.
- Analytics: anonymous page, tool and article events (daily-rotating hash, no raw IPs, Do Not Track respected). Run `select public.refresh_daily_stats(current_date);` from a scheduled job to fill `daily_stats`.

## Admin dashboard (Phase 3a)
- Run `supabase/migrations/0005_admin_stats.sql` (dashboard statistics function, admin-only).
- Built now: Dashboard (live stats and charts, empty states), Messages, Users (roles, activate/deactivate, remove, CSV export), Tools (enable, status, content, SEO), Security & Activity Logs. Other sidebar modules show a "soon" page.
- Every admin page and server action checks the role itself; RLS and database triggers are a second layer. Editors only see editor-level modules.
- "Total visitors" is the sum of daily unique visitors (visitor hashes rotate daily), not lifetime unique people.
- Message replies open your own email app (`mailto:`). A connected email service is not configured.
- Logged so far: admin login/logout, message status/notes/delete, user role/status/delete/export, tool and SEO changes.

## Admin dashboard (Phase 3b) and remaining modules
- Run `supabase/migrations/0006_cms_analytics.sql` (analytics function, editor access to the homepage setting).
- New admin modules: Blog Management (editor, SEO checklist, schedule, FAQ), Content Management (homepage and footer), Pages Management, SEO Management (global settings and audit), Media Library, Advertisement Management, Newsletter Management, Analytics, Site Settings, Roles & Permissions (read-only), Admin Profile.
- Also added: /signup (off by default, switch in Site Settings), optional Cloudflare Turnstile on the contact form, optional email replies via Resend, Content-Security-Policy in report-only mode.
- `components/admin/RichEditor.tsx` is an older unused draft; delete it (`EditorField.tsx` is the editor in use).
- Full deployment steps and the 21-point acceptance checklist are in `DEPLOYMENT.md`. RLS test script: `supabase/tests/rls_checks.sql`.
