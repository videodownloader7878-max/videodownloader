insert into public.admin_roles(role, description, permissions) values
 ('super_admin','Full system access','{*}'),
 ('admin','Manage website, users, articles, SEO, messages and settings','{content,blog,seo,tools,users,messages,analytics,ads,newsletter,media,pages,settings,logs}'),
 ('editor','Create and edit content; no user, security or settings access','{content,blog,seo,pages,media}'),
 ('user','Normal account access only','{}')
on conflict (role) do nothing;

insert into public.tools(slug, name, sort_order) values
 ('youtube-downloader','YouTube Downloader',1),('facebook-downloader','Facebook Downloader',2),('instagram-downloader','Instagram Downloader',3),
 ('tiktok-downloader','TikTok Downloader',4),('twitter-downloader','Twitter (X) Downloader',5),('pinterest-downloader','Pinterest Downloader',6),
 ('vimeo-downloader','Vimeo Downloader',7),('dailymotion-downloader','Dailymotion Downloader',8),('reddit-downloader','Reddit Downloader',9),
 ('threads-downloader','Threads Downloader',10),('linkedin-downloader','LinkedIn Downloader',11),('video-to-mp3','Video to MP3 Converter',12)
on conflict (slug) do nothing;

insert into public.ad_settings(placement) values ('homepage'),('tool_page'),('blog'),('sidebar'),('footer') on conflict (placement) do nothing;

-- Storage: images only (SVG excluded on purpose), 5 MB max. Public read, editor-only writes.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('media','media',true,5242880,array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;
create policy media_obj_read on storage.objects for select using (bucket_id = 'media');
create policy media_obj_insert on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_editor());
create policy media_obj_update on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_editor());
create policy media_obj_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
