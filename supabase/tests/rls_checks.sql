-- RLS and trigger checks. Run in the Supabase SQL editor on a TEST project after migrations 0001-0006.
-- Everything runs in one transaction and is rolled back. Each failure raises "FAIL: ...". Success ends with a NOTICE.
-- NOT YET RUN by the author. If the auth.users insert needs extra columns on your Supabase version, add them.
begin;
insert into auth.users(id, email) values
 ('00000000-0000-0000-0000-0000000000a1','super@test.local'),('00000000-0000-0000-0000-0000000000a2','admin@test.local'),
 ('00000000-0000-0000-0000-0000000000a3','editor@test.local'),('00000000-0000-0000-0000-0000000000a4','user@test.local');
update public.profiles set role='super_admin' where id='00000000-0000-0000-0000-0000000000a1';
update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000a2';
update public.profiles set role='editor' where id='00000000-0000-0000-0000-0000000000a3';
insert into public.contact_messages(name,email,subject,message) values ('t','t@test.local','subject','0123456789');
insert into public.blog_posts(slug,title,status,published_at) values ('pub','Pub','published',now()-interval '1 day'),('drf','Draft','draft',null);

-- anonymous visitor
set local role anon;
do $$ declare n int; begin
  select count(*) into n from public.contact_messages; if n <> 0 then raise exception 'FAIL: anon can read contact_messages'; end if;
  select count(*) into n from public.profiles; if n <> 0 then raise exception 'FAIL: anon can read profiles'; end if;
  select count(*) into n from public.activity_logs; if n <> 0 then raise exception 'FAIL: anon can read activity_logs'; end if;
  select count(*) into n from public.newsletter_subscribers; if n <> 0 then raise exception 'FAIL: anon can read subscribers'; end if;
  select count(*) into n from public.blog_posts where slug in ('pub','drf'); if n <> 1 then raise exception 'FAIL: anon should see only the published post, saw %', n; end if;
  raise notice 'PASS anon';
end $$;
reset role;

-- normal user
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin
  select count(*) into n from public.profiles; if n <> 1 then raise exception 'FAIL: user should see only own profile, saw %', n; end if;
  select count(*) into n from public.contact_messages; if n <> 0 then raise exception 'FAIL: user can read messages'; end if;
  begin update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000a4'; raise exception 'FAIL: user escalated own role';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin insert into public.activity_logs(actor_id,action) values ('00000000-0000-0000-0000-0000000000a4','x'); raise exception 'FAIL: user wrote activity log';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin insert into public.blog_posts(slug,title) values ('hack','Hack'); raise exception 'FAIL: user created a post';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  raise notice 'PASS user';
end $$;
reset role;

-- editor
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin
  insert into public.blog_posts(slug,title) values ('ed-post','Editor post');
  select count(*) into n from public.blog_posts where slug='drf'; if n <> 1 then raise exception 'FAIL: editor should see drafts'; end if;
  select count(*) into n from public.contact_messages; if n <> 0 then raise exception 'FAIL: editor can read messages'; end if;
  update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000a4'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: editor changed another user'; end if;
  begin delete from public.blog_posts where slug='pub'; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL: editor deleted a post'; end if; end;
  raise notice 'PASS editor';
end $$;
reset role;

-- admin
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin
  select count(*) into n from public.contact_messages; if n < 1 then raise exception 'FAIL: admin cannot read messages'; end if;
  update public.profiles set role='editor' where id='00000000-0000-0000-0000-0000000000a4'; get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL: admin could not assign editor'; end if;
  begin update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000a4'; raise exception 'FAIL: admin promoted to admin';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin update public.profiles set role='user' where id='00000000-0000-0000-0000-0000000000a2'; raise exception 'FAIL: admin changed own role';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  raise notice 'PASS admin';
end $$;
reset role;

-- super admin
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin
  update public.profiles set role='admin' where id='00000000-0000-0000-0000-0000000000a4'; get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL: super_admin could not assign admin'; end if;
  raise notice 'PASS super_admin';
end $$;
reset role;
do $$ begin raise notice 'ALL RLS CHECKS PASSED'; end $$;
rollback;
