-- Row Level Security. Public inserts (contact, newsletter, usage events) go through server routes
-- using the service-role key, so no public INSERT policies exist on purpose.
do $$ declare t text; begin
  foreach t in array array['profiles','admin_roles','tools','pages','categories','tags','blog_posts','blog_post_tags','contact_messages',
    'newsletter_subscribers','usage_events','daily_stats','site_settings','seo_settings','ad_settings','media_assets','activity_logs','api_integrations'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop; end $$;

-- profiles
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
-- (role/status changes are further restricted by the protect_profile trigger; no insert/delete policies)

create policy admin_roles_select on public.admin_roles for select to authenticated using (public.is_editor());
create policy admin_roles_write on public.admin_roles for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- tools
create policy tools_public on public.tools for select to anon, authenticated using (is_enabled);
create policy tools_staff_select on public.tools for select to authenticated using (public.is_editor());
create policy tools_admin_write on public.tools for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- pages
create policy pages_public on public.pages for select to anon, authenticated using (status = 'published');
create policy pages_staff_select on public.pages for select to authenticated using (public.is_editor());
create policy pages_editor_insert on public.pages for insert to authenticated with check (public.is_editor());
create policy pages_editor_update on public.pages for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy pages_admin_delete on public.pages for delete to authenticated using (public.is_admin());

-- categories, tags
create policy categories_public on public.categories for select to anon, authenticated using (true);
create policy categories_editor_write on public.categories for insert to authenticated with check (public.is_editor());
create policy categories_editor_update on public.categories for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy categories_admin_delete on public.categories for delete to authenticated using (public.is_admin());
create policy tags_public on public.tags for select to anon, authenticated using (true);
create policy tags_editor_write on public.tags for insert to authenticated with check (public.is_editor());
create policy tags_editor_update on public.tags for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy tags_admin_delete on public.tags for delete to authenticated using (public.is_admin());

-- blog posts ('scheduled' posts become public automatically once published_at has passed)
create policy posts_public on public.blog_posts for select to anon, authenticated
  using (status in ('published','scheduled') and published_at is not null and published_at <= now());
create policy posts_staff_select on public.blog_posts for select to authenticated using (public.is_editor());
create policy posts_editor_insert on public.blog_posts for insert to authenticated with check (public.is_editor());
create policy posts_editor_update on public.blog_posts for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy posts_admin_delete on public.blog_posts for delete to authenticated using (public.is_admin());
create policy post_tags_public on public.blog_post_tags for select to anon, authenticated
  using (public.is_editor() or exists (select 1 from public.blog_posts p where p.id = post_id and p.status in ('published','scheduled') and p.published_at <= now()));
create policy post_tags_editor_write on public.blog_post_tags for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- private data: admins only
create policy messages_admin on public.contact_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy newsletter_admin on public.newsletter_subscribers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy usage_admin_select on public.usage_events for select to authenticated using (public.is_admin());
create policy stats_admin_select on public.daily_stats for select to authenticated using (public.is_admin());
create policy integrations_admin on public.api_integrations for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- logs: admins read; staff may insert rows attributed to themselves
create policy logs_admin_select on public.activity_logs for select to authenticated using (public.is_admin());
create policy logs_staff_insert on public.activity_logs for insert to authenticated with check (public.is_editor() and actor_id = auth.uid());

-- settings, seo, ads, media
create policy settings_public on public.site_settings for select to anon, authenticated using (is_public);
create policy settings_staff_select on public.site_settings for select to authenticated using (public.is_admin());
create policy settings_admin_write on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy seo_public on public.seo_settings for select to anon, authenticated using (true);
create policy seo_editor_insert on public.seo_settings for insert to authenticated with check (public.is_editor());
create policy seo_editor_update on public.seo_settings for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy seo_admin_delete on public.seo_settings for delete to authenticated using (public.is_admin());
create policy ads_public on public.ad_settings for select to anon, authenticated using (is_enabled);
create policy ads_staff_select on public.ad_settings for select to authenticated using (public.is_admin());
create policy ads_admin_write on public.ad_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy media_public on public.media_assets for select to anon, authenticated using (true);
create policy media_editor_insert on public.media_assets for insert to authenticated with check (public.is_editor());
create policy media_editor_update on public.media_assets for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy media_admin_delete on public.media_assets for delete to authenticated using (public.is_admin());
