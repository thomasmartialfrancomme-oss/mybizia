-- FixMyBusiness AI / Supabase PostgreSQL schema
create extension if not exists pgcrypto;

create type public.user_role as enum ('USER', 'ADMIN');
create type public.plan_code as enum ('FREE', 'PRO', 'BUSINESS');
create type public.subscription_status as enum ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role public.user_role not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_name_length check (char_length(name) <= 120)
);
create table public.websites (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, url text not null, monitoring_enabled boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint websites_url_length check (char_length(url) <= 2048)
);
create index websites_user_id_idx on public.websites(user_id);
create table public.analyses (
  id uuid primary key default gen_random_uuid(), website_id uuid references public.websites(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  url text not null, status text not null default 'PENDING' check (status in ('PENDING','RUNNING','COMPLETED','PARTIAL','FAILED')),
  requested_page_count integer not null default 1 check (requested_page_count between 1 and 25), page_count integer not null default 0,
  global_score integer check (global_score between 0 and 100), summary text, limitations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), started_at timestamptz, completed_at timestamptz, error_message text
);
create index analyses_user_created_idx on public.analyses(user_id, created_at desc);
create table public.analysis_pages (
  id uuid primary key default gen_random_uuid(), analysis_id uuid not null references public.analyses(id) on delete cascade,
  url text not null, http_status integer, response_ms integer, response_size integer, depth integer not null default 0, title text, created_at timestamptz not null default now()
);
create table public.analysis_results (
  id uuid primary key default gen_random_uuid(), analysis_id uuid not null references public.analyses(id) on delete cascade,
  page_id uuid references public.analysis_pages(id) on delete cascade, category text not null, rule text not null,
  status text not null, severity text not null, score integer not null check (score between 0 and 100), title text not null, evidence text not null, recommendation text not null,
  created_at timestamptz not null default now()
);
create table public.issues (
  id uuid primary key default gen_random_uuid(), analysis_id uuid not null references public.analyses(id) on delete cascade,
  result_id uuid references public.analysis_results(id) on delete cascade, fingerprint text not null, status text not null default 'OPEN' check (status in ('OPEN','RESOLVED')),
  first_seen_at timestamptz not null default now(), resolved_at timestamptz
);
create unique index issues_fingerprint_analysis_idx on public.issues(analysis_id, fingerprint);
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null, kind text not null, input_hash text, output text, provider text, status text not null default 'COMPLETED', created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid unique not null references public.profiles(id) on delete cascade,
  stripe_customer_id text unique, stripe_subscription_id text unique, stripe_price_id text, plan public.plan_code not null default 'FREE', status public.subscription_status not null default 'ACTIVE',
  current_period_start timestamptz, current_period_end timestamptz, cancel_at_period_end boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.usage (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  month_key text not null, analyses_count integer not null default 0, pages_count integer not null default 0, updated_at timestamptz not null default now(), unique(user_id, month_key)
);
create table public.stripe_events (
  event_id text primary key, event_type text not null, status text not null default 'RECEIVED', processed_at timestamptz, error_message text, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null, actor_role text, action text not null, entity_type text, entity_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))); insert into public.subscriptions (user_id) values (new.id); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.websites enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_pages enable row level security;
alter table public.analysis_results enable row level security;
alter table public.issues enable row level security;
alter table public.ai_generations enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;
alter table public.stripe_events enable row level security;
alter table public.audit_logs enable row level security;

create policy "profile owner read" on public.profiles for select using (id = auth.uid());
create policy "profile owner update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "website owner all" on public.websites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "analysis owner read" on public.analyses for select using (user_id = auth.uid());
create policy "analysis owner insert" on public.analyses for insert with check (user_id = auth.uid());
create policy "analysis owner update" on public.analyses for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "page through analysis owner" on public.analysis_pages for select using (exists (select 1 from public.analyses a where a.id = analysis_id and a.user_id = auth.uid()));
create policy "result through analysis owner" on public.analysis_results for select using (exists (select 1 from public.analyses a where a.id = analysis_id and a.user_id = auth.uid()));
create policy "issue through analysis owner" on public.issues for select using (exists (select 1 from public.analyses a where a.id = analysis_id and a.user_id = auth.uid()));
create policy "ai generation owner" on public.ai_generations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notification owner" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "subscription owner read" on public.subscriptions for select using (user_id = auth.uid());
create policy "usage owner read" on public.usage for select using (user_id = auth.uid());
create policy "no client stripe events" on public.stripe_events for select using (false);
create policy "audit owner read" on public.audit_logs for select using (user_id = auth.uid());

-- Service-role-only writes to billing, webhook and audit tables are intentional.
revoke all on public.stripe_events from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;
