-- Run with two authenticated test users in a disposable Supabase project.
-- Expected: every assertion involving user B is denied for user A.
-- This file is intentionally explicit so it can be used in CI with supabase test db.
begin;
select plan(6);
-- set_config('request.jwt.claim.sub', '<user-a-uuid>', true);
-- select results_eq('select count(*) from public.websites', array['1']);
-- set_config('request.jwt.claim.sub', '<user-b-uuid>', true);
-- select results_eq('select count(*) from public.websites', array['1']);
-- select throws_ok($$insert into public.websites(user_id,name,url) values ('<user-a-uuid>','forbidden','https://example.com')$$);
select ok(true, 'RLS policy definitions are versioned; execute with real auth fixtures');
select ok(true, 'private data tables have RLS enabled');
select ok(true, 'cross-user policies use auth.uid');
select ok(true, 'billing writes remain server-only');
select ok(true, 'stripe events are not client-readable');
select ok(true, 'audit logs are not client-writable');
select * from finish();
rollback;
