-- One call for all dashboard numbers. Admin-only (checked inside the function).
create or replace function public.admin_dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'visitors_total', coalesce((select sum(c) from (select count(distinct visitor_hash) c from usage_events where event_type='page_view' group by (created_at at time zone 'UTC')::date) x),0),
    'visitors_today', (select count(distinct visitor_hash) from usage_events where event_type='page_view' and created_at >= current_date),
    'visitors_month', coalesce((select sum(c) from (select count(distinct visitor_hash) c from usage_events where event_type='page_view' and created_at >= now() - interval '30 days' group by (created_at at time zone 'UTC')::date) x),0),
    'users', (select count(*) from profiles),
    'posts_total', (select count(*) from blog_posts),
    'posts_published', (select count(*) from blog_posts where status in ('published','scheduled') and published_at <= now()),
    'posts_draft', (select count(*) from blog_posts where status = 'draft'),
    'tool_uses', (select count(*) from usage_events where event_type='tool_use'),
    'messages', (select count(*) from contact_messages),
    'messages_unread', (select count(*) from contact_messages where status='unread'),
    'subscribers', (select count(*) from newsletter_subscribers where status='subscribed'),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('label', to_char(d,'MM-DD'), 'value', coalesce(v.c,0)) order by d),'[]'::jsonb)
      from generate_series((current_date-29)::timestamp, current_date::timestamp, interval '1 day') d
      left join (select (created_at at time zone 'UTC')::date day, count(distinct visitor_hash) c from usage_events where event_type='page_view' and created_at >= current_date-29 group by 1) v on v.day = d::date),
    'weekly', (select coalesce(jsonb_agg(jsonb_build_object('label', to_char(w,'MM-DD'), 'value', coalesce(v.c,0)) order by w),'[]'::jsonb)
      from generate_series(date_trunc('week', current_date::timestamp) - interval '11 weeks', date_trunc('week', current_date::timestamp), interval '1 week') w
      left join (select date_trunc('week', created_at at time zone 'UTC') wk, count(*) c from usage_events where event_type='page_view' and created_at >= now() - interval '12 weeks' group by 1) v on v.wk = w),
    'monthly', (select coalesce(jsonb_agg(jsonb_build_object('label', to_char(m,'Mon'), 'value', coalesce(v.c,0)) order by m),'[]'::jsonb)
      from generate_series(date_trunc('month', current_date::timestamp) - interval '11 months', date_trunc('month', current_date::timestamp), interval '1 month') m
      left join (select date_trunc('month', created_at at time zone 'UTC') mo, count(*) c from usage_events where event_type='page_view' and created_at >= now() - interval '12 months' group by 1) v on v.mo = m),
    'signups', (select coalesce(jsonb_agg(jsonb_build_object('label', to_char(d,'MM-DD'), 'value', coalesce(v.c,0)) order by d),'[]'::jsonb)
      from generate_series((current_date-29)::timestamp, current_date::timestamp, interval '1 day') d
      left join (select (created_at at time zone 'UTC')::date day, count(*) c from profiles where created_at >= current_date-29 group by 1) v on v.day = d::date),
    'tools', (select coalesce(jsonb_agg(jsonb_build_object('label', tool_slug, 'value', c)),'[]'::jsonb) from (select tool_slug, count(*) c from usage_events where event_type='tool_use' and tool_slug is not null group by 1 order by 2 desc limit 5) t),
    'pages', (select coalesce(jsonb_agg(jsonb_build_object('label', path, 'value', c)),'[]'::jsonb) from (select path, count(*) c from usage_events where event_type='page_view' and path is not null group by 1 order by 2 desc limit 5) t),
    'articles', (select coalesce(jsonb_agg(jsonb_build_object('label', title, 'value', c)),'[]'::jsonb) from (select b.title, count(*) c from usage_events e join blog_posts b on b.id = e.post_id where e.event_type='article_view' group by b.title order by 2 desc limit 5) t)
  ) into r;
  return r;
end $$;
revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
