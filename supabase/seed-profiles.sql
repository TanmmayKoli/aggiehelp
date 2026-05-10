insert into public.profiles (id, name, email, role, campus_area, verification_level, completed_assists, reliability_score)
select id, 'Tanmmay', email, 'requester', 'Tercero', 'Photo Verified', 3, 98
from auth.users
where email = 'tanmmay@ucdavis.edu'
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  campus_area = excluded.campus_area,
  verification_level = excluded.verification_level,
  completed_assists = excluded.completed_assists,
  reliability_score = excluded.reliability_score;

insert into public.profiles (id, name, email, role, campus_area, verification_level, completed_assists, reliability_score)
select id, 'Maya', email, 'helper', 'Tercero', 'Campus Email', 8, 100
from auth.users
where email = 'maya@ucdavis.edu'
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  campus_area = excluded.campus_area,
  verification_level = excluded.verification_level,
  completed_assists = excluded.completed_assists,
  reliability_score = excluded.reliability_score;

insert into public.profiles (id, name, email, role, campus_area, verification_level, completed_assists, reliability_score)
select id, 'Alex', email, 'helper', 'Segundo', 'Walking Buddy', 12, 97
from auth.users
where email = 'alex@ucdavis.edu'
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  campus_area = excluded.campus_area,
  verification_level = excluded.verification_level,
  completed_assists = excluded.completed_assists,
  reliability_score = excluded.reliability_score;

insert into public.profiles (id, name, email, role, campus_area, verification_level, completed_assists, reliability_score)
select id, 'Priya', email, 'moderator', 'Campus', 'Campus Moderator', 0, 100
from auth.users
where email = 'priya@ucdavis.edu'
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  campus_area = excluded.campus_area,
  verification_level = excluded.verification_level,
  completed_assists = excluded.completed_assists,
  reliability_score = excluded.reliability_score;

insert into public.profiles (id, name, email, role, campus_area, verification_level, completed_assists, reliability_score)
select id, 'Admin', email, 'admin', 'Campus', 'Admin', 0, 100
from auth.users
where email = 'admin@ucdavis.edu'
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  campus_area = excluded.campus_area,
  verification_level = excluded.verification_level,
  completed_assists = excluded.completed_assists,
  reliability_score = excluded.reliability_score;

with tanmmay as (
  select id from public.profiles where email = 'tanmmay@ucdavis.edu'
),
request_upsert as (
  insert into public.assist_requests (
    requester_id,
    title,
    description,
    category,
    from_area,
    to_area,
    time_window,
    effort_level,
    support_need,
    requires_car,
    safety_status,
    status
  )
  select
    tanmmay.id,
    'Help carrying groceries from Trader Joe''s',
    'I''m on crutches and need help carrying groceries from Trader Joe''s to Tercero tonight.',
    'Grocery / Carrying',
    'Trader Joe''s',
    'Tercero',
    'Today, 6-7 PM',
    'Medium',
    'Mobility support',
    true,
    'safe',
    'open'
  from tanmmay
  returning id
),
maya as (
  select id from public.profiles where email = 'maya@ucdavis.edu'
)
insert into public.assist_offers (
  helper_id,
  request_id,
  description,
  category,
  from_area,
  to_area,
  time_window,
  has_car,
  max_effort,
  status
)
select
  maya.id,
  request_upsert.id,
  'I''m driving to Trader Joe''s at 6 PM and coming back near Tercero. I can help carry light groceries.',
  'Grocery / Carrying',
  'Trader Joe''s',
  'Tercero',
  'Today, 6-7 PM',
  true,
  'Medium',
  'open'
from maya, request_upsert;
