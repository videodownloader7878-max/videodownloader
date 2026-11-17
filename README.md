# MediaAura – Phase 2a: Landing page (Next.js)

Setup
1. `npm install`
2. `cp .env.example .env.local` and fill in your Supabase URL and anon key (optional for now; without them the articles section shows its empty state)
3. `npm run dev` then open http://localhost:3000

Status
- Done: landing page, theme toggle, link detection, tool grid, articles section (reads published `blog_posts` from Supabase), footer
- Not built yet (links will 404 until added): tool pages, /blog, /signin, /about, /contact, legal pages, newsletter API
- Articles query expects table `blog_posts` (id, slug, title, excerpt, featured_image, published_at, is_featured, status, category link to `categories`). The Phase 1 migrations will create it.
- Not verified: `npm run build` was not run here (no network in this environment). Run it locally and send me any errors.
