# MediaAura deployment guide

## 1. Supabase
1. Create a project. Note the Project URL, anon key and service-role key (Settings → API).
2. SQL editor: run `supabase/migrations/0001` … `0006` in order. (Optional, on a TEST project: run `supabase/tests/rls_checks.sql`.)
3. Authentication → URL Configuration: set Site URL to your domain and add `https://your-domain/**` as a redirect URL.
4. Authentication → Providers → Email: keep "Confirm email" on. If you do not want public accounts, turn off "Allow new users to sign up".
5. Storage: the `media` bucket is created by migration 0003 (public read, images only, 5 MB).

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)
| Name | Required | Notes |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | yes | public |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | yes | public |
| SUPABASE_SERVICE_ROLE_KEY | yes | SECRET, server only. Never prefix with NEXT_PUBLIC_ |
| NEXT_PUBLIC_SITE_URL | yes | e.g. https://example.com (sitemap, robots) |
| HASH_SALT | recommended | any long random string (anonymous analytics) |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY | optional | enables captcha on the contact form |
| RESEND_API_KEY, RESEND_FROM | optional | enables sending replies from the admin |
| ADS_ALLOWED_HOSTS | optional | hosts allowed for alternative ad scripts |
| ADMIN_EMAIL, ADMIN_PASSWORD | one-off | only locally, for create-admin; never set on Vercel |

## 3. First administrator
Locally, with `.env.local` pointing at your Supabase project plus ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars):
`npm install && npm run create-admin`. It refuses to run if a super_admin exists. Then delete the two ADMIN_ lines.

## 4. Deploy
Push to GitHub, import the repository in Vercel (framework: Next.js), add the variables, deploy. `postinstall` copies the FFmpeg core into `public/ffmpeg`.
Open `/signin`, log in, open `/admin`. Run `npm run build` locally first to catch errors.

## 5. After first deploy
- Publish your legal pages (Pages Management). Have them reviewed by a qualified person.
- Browser console: check for Content-Security-Policy-Report-Only violations; when clean, rename the header in `next.config.mjs` to `Content-Security-Policy`.
- Rate limiting is in-memory per instance. For a shared limit use Upstash/Redis.
- Tools: after testing, set a tool to Verified in Tools Management to enable its link preview (public oEmbed only; no file downloads).

## Acceptance test (21 points): how to check each
1 Homepage matches the reference: open `/` on desktop and phone.
2 12 tool pages: open each slug; paste a matching https link.
3 Sign In works: `/signin`.
4 Role verified server-side: change a profile role in SQL; reload `/admin`.
5 Normal user cannot open `/admin`: sign in as a user; expect redirect to `/`.
6 Only authorized admins see Admin Dashboard: header as visitor, user, editor, admin.
7 Create and publish an article: Blog Management → New.
8 It appears on the homepage within a minute.
9 Edit homepage text: Content Management.
10 SEO settings: SEO Management and each editor.
11 Tools: Tools Management.
12 Users: Users Management (roles, deactivate, export).
13 Contact form → Messages module.
14 Newsletter: footer form → Newsletter Management.
15 Media library: upload, replace, delete.
16 Ads: enable a placement with real IDs; check it renders and is labelled.
17 Analytics show real data: browse the site, then open Dashboard and Analytics.
18 Audit logs: Security & Activity Logs after doing the above.
19 RLS: run `supabase/tests/rls_checks.sql` and the manual checks in SETUP.md.
20 No secrets in the browser: search the built JS and page source for the service-role key (must not appear).
21 `npm run build` succeeds.

## Known limitations
- Platform downloaders do not download files (by design: only permitted functionality). Video-to-MP3 is browser-only, 300 MB max.
- The rich text editor uses the browser's built-in editing commands (`execCommand`); content is sanitized on save and on display.
- Not yet run by the author: build, SQL migrations, RLS checks. Treat the first run as testing.
