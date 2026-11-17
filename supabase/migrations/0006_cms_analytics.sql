-- Editors may edit the homepage content setting (and only that key).
create policy settings_editor_home_insert on public.site_settings for insert to authenticated with check (public.is_editor() and key = 'home');
create policy settings_editor_home_update on public.site_settings for update to authenticated using (public.is_editor() and key = 'home') with check (public.is_editor() and key = 'home');

create or replace function public.admin_analytics(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare d int := least(greatest(coalesce(p_days,30),1),365); r jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'page_views', (select count(*) from usage_events where event_type='page_view' and created_at >= current_date-(d-1)),
    'visitors', coalesce((select sum(c) from (select count(distinct visitor_hash) c from usage_events where event_type='page_view' and created_at >= current_date-(d-1) group by (created_at at time zone 'UTC')::date) x),0),
    'tool_uses', (select count(*) from usage_events where event_type='tool_use' and created_at >= current_date-(d-1)),
    'article_views', (select count(*) from usage_events where event_type='article_view' and created_at >= current_date-(d-1)),
    'daily_views', (select coalesce(jsonb_agg(jsonb_build_object('label', to_char(g,'MM-DD'), 'value', coalesce(v.c,0)) order by g),'[]'::jsonb)
      from generate_series((current_date-(d-1))::timestamp, current_date::timestamp, interval '1 day') g
      left join (select (created_at at time zone 'UTC')::date day, count(*) c from usage_events where event_type='page_view' and created_at >= current_date-(d-1) group by 1) v on v.day = g::date),
    'daily_visitors', (select coalesce(jsonb_agg(jsonb_build_object('label', to_char(g,'MM-DD'), 'value', coalesce(v.c,0)) order by g),'[]'::jsonb)
      from generate_series((current_date-(d-1))::timestamp, current_date::timestamp, interval '1 day') g
      left join (select (created_at at time zone 'UTC')::date day, count(distinct visitor_hash) c from usage_events where event_type='page_view' and created_at >= current_date-(d-1) group by 1) v on v.day = g::date),
    'pages', (select coalesce(jsonb_agg(jsonb_build_object('label', path, 'value', c)),'[]'::jsonb) from (select path, count(*) c from usage_events where event_type='page_view' and path is not null and created_at >= current_date-(d-1) group by 1 order by 2 desc limit 10) t),
    'tools', (select coalesce(jsonb_agg(jsonb_build_object('label', tool_slug, 'value', c)),'[]'::jsonb) from (select tool_slug, count(*) c from usage_events where event_type='tool_use' and tool_slug is not null and created_at >= current_date-(d-1) group by 1 order by 2 desc limit 10) t),
    'articles', (select coalesce(jsonb_agg(jsonb_build_object('label', title, 'value', c)),'[]'::jsonb) from (select b.title, count(*) c from usage_events e join blog_posts b on b.id = e.post_id where e.event_type='article_view' and e.created_at >= current_date-(d-1) group by b.title order by 2 desc limit 10) t)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_analytics(int) from public, anon;
grant execute on function public.admin_analytics(int) to authenticated;
