-- Keeps CMS page slugs from colliding with built-in routes, and seeds starter pages as DRAFTS.
alter table public.pages add constraint pages_slug_reserved check (slug not in
 ('admin','api','blog','signin','contact','unsubscribe','sitemap','robots','sitemap.xml','robots.txt',
  'youtube-downloader','facebook-downloader','instagram-downloader','tiktok-downloader','twitter-downloader','pinterest-downloader',
  'vimeo-downloader','dailymotion-downloader','reddit-downloader','threads-downloader','linkedin-downloader','video-to-mp3'));
insert into public.pages(slug, title, content, status) values
 ('about','About MediaAura','<p>Replace this starter text with your own description of MediaAura.</p>','draft'),
 ('privacy-policy','Privacy Policy','<p>MediaAura records anonymous page and tool usage using a hashed identifier, stores messages sent through the contact form, and stores your email address if you subscribe to the newsletter. Review and complete this policy for your jurisdiction before publishing.</p>','draft'),
 ('terms','Terms and Conditions','<p>Replace this starter text with your own terms before publishing.</p>','draft'),
 ('copyright-policy','Copyright Policy','<p>Replace this starter text with your own copyright policy before publishing.</p>','draft'),
 ('dmca','DMCA Policy','<p>Replace this starter text with your own DMCA policy and takedown contact before publishing.</p>','draft')
on conflict (slug) do nothing;
