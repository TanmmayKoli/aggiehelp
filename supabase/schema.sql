create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text default 'student',
  campus_area text,
  verification_level text default 'campus_email',
  completed_assists int default 0,
  reliability_score int default 100,
  created_at timestamptz default now()
);

create table if not exists public.safe_spots (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  area text,
  lat double precision,
  lng double precision,
  type text,
  tags text[],
  description text,
  is_public boolean default true
);

create table if not exists public.assist_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text,
  from_area text,
  to_area text,
  time_window text,
  effort_level text,
  support_need text,
  requires_car boolean default false,
  safety_status text default 'safe',
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists public.assist_offers (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid references public.profiles(id) on delete cascade,
  request_id uuid references public.assist_requests(id) on delete cascade,
  description text not null,
  category text,
  from_area text,
  to_area text,
  time_window text,
  has_car boolean default false,
  max_effort text,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.assist_requests(id) on delete cascade,
  offer_id uuid references public.assist_offers(id) on delete cascade,
  requester_id uuid references public.profiles(id) on delete cascade,
  helper_id uuid references public.profiles(id) on delete cascade,
  requester_accepted boolean default false,
  helper_confirmed boolean default false,
  requester_contact_consent boolean default false,
  helper_contact_consent boolean default false,
  contact_sharing_enabled boolean default false,
  safe_spot_id uuid references public.safe_spots(id) on delete set null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  moderation_status text default 'allowed',
  blocked_reason text,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  reason text,
  description text,
  status text default 'open',
  created_at timestamptz default now()
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid
      and role in ('admin', 'moderator')
  );
$$;

alter table public.profiles enable row level security;
alter table public.assist_requests enable row level security;
alter table public.assist_offers enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.safe_spots enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles select authenticated" on public.profiles;
create policy "profiles select authenticated" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "requests select authenticated" on public.assist_requests;
create policy "requests select authenticated" on public.assist_requests
  for select to authenticated using (true);

drop policy if exists "requests insert own" on public.assist_requests;
create policy "requests insert own" on public.assist_requests
  for insert to authenticated with check (requester_id = auth.uid());

drop policy if exists "requests update own" on public.assist_requests;
create policy "requests update own" on public.assist_requests
  for update to authenticated using (requester_id = auth.uid()) with check (requester_id = auth.uid());

drop policy if exists "offers select authenticated" on public.assist_offers;
create policy "offers select authenticated" on public.assist_offers
  for select to authenticated using (true);

drop policy if exists "offers insert own" on public.assist_offers;
create policy "offers insert own" on public.assist_offers
  for insert to authenticated with check (helper_id = auth.uid());

drop policy if exists "offers update own" on public.assist_offers;
create policy "offers update own" on public.assist_offers
  for update to authenticated using (helper_id = auth.uid()) with check (helper_id = auth.uid());

drop policy if exists "matches select own or admin" on public.matches;
create policy "matches select own or admin" on public.matches
  for select to authenticated
  using (requester_id = auth.uid() or helper_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "matches insert own" on public.matches;
create policy "matches insert own" on public.matches
  for insert to authenticated
  with check (requester_id = auth.uid() or helper_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "matches update own" on public.matches;
create policy "matches update own" on public.matches
  for update to authenticated
  using (requester_id = auth.uid() or helper_id = auth.uid() or public.is_admin(auth.uid()))
  with check (requester_id = auth.uid() or helper_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "messages select own match or admin" on public.messages;
create policy "messages select own match or admin" on public.messages
  for select to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.requester_id = auth.uid() or m.helper_id = auth.uid())
    )
  );

drop policy if exists "messages insert own match" on public.messages;
create policy "messages insert own match" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.requester_id = auth.uid() or m.helper_id = auth.uid())
    )
  );

drop policy if exists "safe spots select authenticated" on public.safe_spots;
create policy "safe spots select authenticated" on public.safe_spots
  for select to authenticated using (true);

drop policy if exists "safe spots insert admin" on public.safe_spots;
create policy "safe spots insert admin" on public.safe_spots
  for insert to authenticated with check (public.is_admin(auth.uid()));

drop policy if exists "safe spots update admin" on public.safe_spots;
create policy "safe spots update admin" on public.safe_spots
  for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "reports insert authenticated" on public.reports;
create policy "reports insert authenticated" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists "reports select admin" on public.reports;
create policy "reports select admin" on public.reports
  for select to authenticated using (public.is_admin(auth.uid()));

insert into public.safe_spots (name, area, lat, lng, type, tags, description, is_public)
values
  ('Tercero Services Center', 'Tercero', 38.5377, -121.7528, 'service_center', array['public lobby', 'student area', 'visible'], 'Public student services area near Tercero residence halls.', true),
  ('Segundo Services Center', 'Segundo', 38.5421, -121.7610, 'service_center', array['public lobby', 'student area', 'visible'], 'Public student services area near Segundo residence halls.', true),
  ('Shields Library Main Entrance', 'Shields Library', 38.5393, -121.7498, 'campus_landmark', array['public', 'well-lit', 'campus landmark'], 'Busy campus landmark with clear visibility.', true),
  ('Memorial Union Front Entrance', 'Memorial Union', 38.5424, -121.7493, 'campus_landmark', array['busy', 'central', 'easy to find'], 'Central campus meetup point with steady foot traffic.', true),
  ('Trader Joe''s Main Entrance', 'Trader Joe''s', 38.5467, -121.7602, 'storefront', array['public', 'busy', 'easy to find'], 'Public grocery pickup point with visible storefront.', true),
  ('Safeway Front Entrance', 'Safeway', 38.5515, -121.7627, 'storefront', array['public', 'busy', 'well-lit'], 'Public grocery pickup point with visible storefront.', true),
  ('Silo Main Entrance', 'Silo', 38.5399, -121.7538, 'campus_landmark', array['busy', 'central', 'food nearby'], 'Central campus food and transit area.', true)
on conflict (name) do update set
  area = excluded.area,
  lat = excluded.lat,
  lng = excluded.lng,
  type = excluded.type,
  tags = excluded.tags,
  description = excluded.description,
  is_public = excluded.is_public;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'assist_requests') then
    alter publication supabase_realtime add table public.assist_requests;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'assist_offers') then
    alter publication supabase_realtime add table public.assist_offers;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches') then
    alter publication supabase_realtime add table public.matches;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports') then
    alter publication supabase_realtime add table public.reports;
  end if;
end $$;
