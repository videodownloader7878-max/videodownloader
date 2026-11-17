-- MediaAura schema. Run 0001, 0002, 0003 in order.
create type public.app_role as enum ('super_admin','admin','editor','user');

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'user',
  is_active boolean not null default true,
  email_verified boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);

create table public.admin_roles (
  role public.app_role primary key,
  description text not null,
  permissions text[] not null default '{}'
);

-- Helpers used by RLS policies and server code. Role comes ONLY from profiles, never from client metadata.
create or replace function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active $$;
create or replace function public.is_super_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() = 'super_admin', false) $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('super_admin','admin'), false) $$;
create or replace function public.is_editor() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('super_admin','admin','editor'), false) $$;

-- New auth users always become role 'user'. Metadata is never used for role.
create or replace function public.handle_auth_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profiles(id, email, full_name, email_verified)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.email_confirmed_at is not null);
  else
    update public.profiles set email = new.email, email_verified = (new.email_confirmed_at is not null) where id = new.id;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_auth_user();
create trigger on_auth_user_updated after update of email, email_confirmed_at on auth.users for each row execute function public.handle_auth_user();

-- Blocks privilege escalation. auth.uid() is null only for service-role/SQL-editor sessions.
create or replace function public.protect_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if new.email is distinct from old.email or new.email_verified is distinct from old.email_verified or new.id is distinct from old.id then
    raise exception 'protected column'; end if;
  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    if not public.is_admin() then raise exception 'not allowed'; end if;
    if old.id = auth.uid() then raise exception 'cannot change your own role or status'; end if;
    if not public.is_super_admin() and (new.role in ('super_admin','admin') or old.role in ('super_admin','admin')) then
      raise exception 'only super_admin can change admin roles'; end if;
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  is_enabled boolean not null default true,
  integration_status text not null default 'not_configured' check (integration_status in ('not_configured','unverified','verified')),
  page_content text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  content text not null default '',
  featured_image text,
  status text not null default 'draft' check (status in ('draft','published')),
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.categories (id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, created_at timestamptz not null default now());
create table public.tags (id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null, created_at timestamptz not null default now());
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  excerpt text,
  content text not null default '',
  featured_image text,
  author_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  is_featured boolean not null default false,
  scheduled_at timestamptz,
  published_at timestamptz,
  faq jsonb not null default '[]',
  word_count int not null default 0,
  reading_time int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_public_idx on public.blog_posts(status, published_at desc);
create index blog_posts_category_idx on public.blog_posts(category_id);
create table public.blog_post_tags (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 1 and 150),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'unread' check (status in ('unread','read','replied','archived')),
  admin_notes text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages(status, created_at desc);
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  status text not null default 'pending' check (status in ('pending','subscribed','unsubscribed')),
  consent_at timestamptz,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create unique index newsletter_email_idx on public.newsletter_subscribers(lower(email));
create table public.usage_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view','tool_use','article_view')),
  path text,
  tool_slug text,
  post_id uuid references public.blog_posts(id) on delete set null,
  visitor_hash text,
  created_at timestamptz not null default now()
);
create index usage_events_created_idx on public.usage_events(created_at);
create index usage_events_tool_idx on public.usage_events(tool_slug, created_at);
create table public.daily_stats (
  day date primary key,
  page_views int not null default 0,
  unique_visitors int not null default 0,
  tool_uses int not null default 0,
  updated_at timestamptz not null default now()
);
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  is_public boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table public.seo_settings (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global','route','page','post','tool')),
  ref_id uuid,
  path text,
  seo_title text, meta_description text, target_keyword text,
  secondary_keywords text[] not null default '{}',
  canonical_url text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  og_title text, og_description text, og_image text,
  schema_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index seo_settings_scope_idx on public.seo_settings(scope, coalesce(ref_id,'00000000-0000-0000-0000-000000000000'::uuid), coalesce(path,''));
create table public.ad_settings (
  id uuid primary key default gen_random_uuid(),
  placement text not null unique check (placement in ('homepage','tool_page','blog','sidebar','footer')),
  is_enabled boolean not null default false,
  provider text,
  config jsonb not null default '{}', -- public IDs only (e.g. AdSense client/slot). Never secrets.
  updated_at timestamptz not null default now()
);
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  storage_path text not null unique,
  title text, alt_text text, folder text not null default 'general',
  mime_type text not null, size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs(created_at desc);
create table public.api_integrations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'not_configured' check (status in ('not_configured','unverified','verified')),
  is_enabled boolean not null default false,
  config jsonb not null default '{}', -- non-secret settings only; secrets live in server env vars
  updated_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['tools','pages','blog_posts','contact_messages','seo_settings','ad_settings','api_integrations'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated', t);
  end loop; end $$;

create or replace function public.refresh_daily_stats(d date default current_date) returns void
language sql security definer set search_path = public as $$
  insert into public.daily_stats(day, page_views, unique_visitors, tool_uses)
  select d, count(*) filter (where event_type = 'page_view'), count(distinct visitor_hash), count(*) filter (where event_type = 'tool_use')
  from public.usage_events where created_at >= d and created_at < d + 1
  on conflict (day) do update set page_views = excluded.page_views, unique_visitors = excluded.unique_visitors,
    tool_uses = excluded.tool_uses, updated_at = now() $$;
revoke all on function public.refresh_daily_stats(date) from public, anon, authenticated;
