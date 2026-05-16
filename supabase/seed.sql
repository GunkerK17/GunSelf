-- GunSelf sample seed data (idempotent)
-- Run this in Supabase SQL Editor after schema migrations.

do $$
begin
  if not exists (select 1 from public.profiles) then
    raise notice 'No profiles found. Create at least one auth user before running seed.sql.';
    return;
  end if;

  if (select count(*) from public.profiles) < 5 then
    raise notice 'Found fewer than 5 profiles. Seed will run for available users only.';
  end if;
end $$;

-- 1) Ensure first account is admin for demo access.
with ranked_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
)
update public.profiles p
set
  role = case when r.rn = 1 then 'admin' else p.role end,
  display_name = coalesce(
    p.display_name,
    case
      when r.rn = 1 then 'Gun Admin'
      when r.rn = 2 then 'Alex Runner'
      when r.rn = 3 then 'Mia Strength'
      when r.rn = 4 then 'Noah Focus'
      when r.rn = 5 then 'Lena Growth'
      else 'Gun User'
    end
  ),
  email = coalesce(
    p.email,
    case
      when r.rn = 1 then 'admin@gunself.local'
      when r.rn = 2 then 'alex@gunself.local'
      when r.rn = 3 then 'mia@gunself.local'
      when r.rn = 4 then 'noah@gunself.local'
      when r.rn = 5 then 'lena@gunself.local'
      else 'user@gunself.local'
    end
  ),
  phone = coalesce(
    p.phone,
    case
      when r.rn = 1 then '+84900000001'
      when r.rn = 2 then '+84900000002'
      when r.rn = 3 then '+84900000003'
      when r.rn = 4 then '+84900000004'
      when r.rn = 5 then '+84900000005'
      else '+84900009999'
    end
  ),
  timezone = coalesce(p.timezone, 'Asia/Bangkok'),
  is_banned = coalesce(p.is_banned, false)
from ranked_users r
where p.id = r.id
  and r.rn <= 5;

-- 2) Pick up to 5 demo users.
with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.goals (user_id, title, description, target_value, current_value, unit, status, due_date)
select
  u.id,
  '[SEED] Body Fat Goal',
  'Reduce body fat with consistent training and nutrition.',
  15,
  21 - u.rn,
  '%',
  'active',
  current_date + interval '60 days'
from demo_users u
where not exists (
  select 1
  from public.goals g
  where g.user_id = u.id
    and g.title = '[SEED] Body Fat Goal'
);

with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.body_logs (user_id, weight_kg, body_fat_percent, note, logged_at)
select
  u.id,
  70 + (u.rn * 2) - (d * 0.1),
  20 - (u.rn * 0.6) - (d * 0.05),
  '[SEED] weekly body check',
  now() - (d || ' days')::interval
from demo_users u
cross join generate_series(0, 6, 3) as d
where not exists (
  select 1
  from public.body_logs b
  where b.user_id = u.id
    and b.note = '[SEED] weekly body check'
    and date(b.logged_at) = date(now() - (d || ' days')::interval)
);

with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.workouts (user_id, name, duration_minutes, calories_burned, note, logged_at)
select
  u.id,
  case when (d % 2) = 0 then '[SEED] Full Body Strength' else '[SEED] Cardio Intervals' end,
  35 + (u.rn * 5),
  280 + (d * 12),
  '[SEED] workout demo',
  now() - (d || ' days')::interval
from demo_users u
cross join generate_series(0, 13) as d
where not exists (
  select 1
  from public.workouts w
  where w.user_id = u.id
    and w.note = '[SEED] workout demo'
    and date(w.logged_at) = date(now() - (d || ' days')::interval)
);

with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.meals (user_id, meal_type, title, calories, protein_g, carbs_g, fat_g, logged_at)
select
  u.id,
  case when (d % 3) = 0 then 'breakfast' when (d % 3) = 1 then 'lunch' else 'dinner' end,
  '[SEED] High Protein Meal',
  520 + (u.rn * 35),
  38 + u.rn,
  45 + (d % 5),
  18 + (u.rn % 3),
  now() - (d || ' days')::interval
from demo_users u
cross join generate_series(0, 13) as d
where not exists (
  select 1
  from public.meals m
  where m.user_id = u.id
    and m.title = '[SEED] High Protein Meal'
    and date(m.logged_at) = date(now() - (d || ' days')::interval)
);

with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.activity_logs (user_id, activity_type, duration_minutes, distance_km, steps, logged_at)
select
  u.id,
  case when (d % 2) = 0 then 'walk' else 'run' end,
  25 + (u.rn * 4),
  2.5 + (d * 0.15),
  4500 + (d * 220),
  now() - (d || ' days')::interval
from demo_users u
cross join generate_series(0, 9) as d
where not exists (
  select 1
  from public.activity_logs a
  where a.user_id = u.id
    and a.activity_type in ('walk', 'run')
    and date(a.logged_at) = date(now() - (d || ' days')::interval)
);

with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.sleep_logs (user_id, sleep_start, sleep_end, duration_minutes, quality_score)
select
  u.id,
  date_trunc('day', now() - (d || ' days')::interval) - interval '7 hours',
  date_trunc('day', now() - (d || ' days')::interval),
  390 + (u.rn * 10),
  72 + (d % 8)
from demo_users u
cross join generate_series(0, 6) as d
where not exists (
  select 1
  from public.sleep_logs s
  where s.user_id = u.id
    and date(s.created_at) = date(now() - (d || ' days')::interval)
);

with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.mood_logs (user_id, mood_score, energy_score, stress_score, journal_note, logged_at)
select
  u.id,
  6 + (d % 4),
  5 + (u.rn % 4),
  3 + (d % 3),
  '[SEED] mood check-in',
  now() - (d || ' days')::interval
from demo_users u
cross join generate_series(0, 8, 2) as d
where not exists (
  select 1
  from public.mood_logs m
  where m.user_id = u.id
    and m.journal_note = '[SEED] mood check-in'
    and date(m.logged_at) = date(now() - (d || ' days')::interval)
);

with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.skill_logs (user_id, skill_name, duration_minutes, level, note, logged_at)
select
  u.id,
  case when u.rn = 1 then 'Leadership' when u.rn = 2 then 'Mobility' else 'Time Management' end,
  35 + (u.rn * 5),
  case when u.rn = 1 then 'advanced' else 'intermediate' end,
  '[SEED] skill practice',
  now() - (u.rn || ' days')::interval
from demo_users u
where not exists (
  select 1
  from public.skill_logs s
  where s.user_id = u.id
    and s.note = '[SEED] skill practice'
);

with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.finance_logs (user_id, type, category, amount, currency, note, logged_at)
select
  u.id,
  case when u.rn = 1 then 'expense' else 'income' end,
  case when u.rn = 1 then 'supplements' else 'freelance' end,
  case when u.rn = 1 then 45.50 else 320.00 end,
  'USD',
  '[SEED] finance entry',
  now() - (u.rn || ' days')::interval
from demo_users u
where not exists (
  select 1
  from public.finance_logs f
  where f.user_id = u.id
    and f.note = '[SEED] finance entry'
);

with demo_users as (
  select id, row_number() over (order by created_at asc) as rn
  from public.profiles
  order by created_at asc
  limit 5
)
insert into public.ai_notes (user_id, title, content, context)
select
  u.id,
  '[SEED] Weekly AI Coach Insight',
  'Maintain consistency for 5 days this week. Focus on hydration and sleep quality.',
  'weekly_review'
from demo_users u
where not exists (
  select 1
  from public.ai_notes a
  where a.user_id = u.id
    and a.title = '[SEED] Weekly AI Coach Insight'
);

-- 3) Exercise library and mapped workout exercises for first user.
with first_user as (
  select id
  from public.profiles
  order by created_at asc
  limit 1
)
insert into public.exercise_library (user_id, name, category, muscle_group)
select f.id, x.name, x.category, x.muscle_group
from first_user f
cross join (
  values
    ('Barbell Squat', 'strength', 'legs'),
    ('Bench Press', 'strength', 'chest'),
    ('Deadlift', 'strength', 'posterior-chain'),
    ('Plank', 'core', 'core')
) as x(name, category, muscle_group)
where not exists (
  select 1
  from public.exercise_library e
  where e.user_id = f.id
    and e.name = x.name
);

with seed_workouts as (
  select w.id, w.user_id, row_number() over (partition by w.user_id order by w.logged_at desc) as rn
  from public.workouts w
  where w.note = '[SEED] workout demo'
),
exercise_map as (
  select e.user_id, e.id as exercise_id, e.name
  from public.exercise_library e
  where e.name in ('Barbell Squat', 'Bench Press', 'Deadlift', 'Plank')
)
insert into public.workout_exercises (user_id, workout_id, exercise_id, exercise_name, sets, reps, weight_kg, duration_seconds)
select
  sw.user_id,
  sw.id,
  em.exercise_id,
  em.name,
  case when em.name = 'Plank' then 3 else 4 end,
  case when em.name = 'Plank' then null else 8 end,
  case when em.name = 'Plank' then null else 55.0 end,
  case when em.name = 'Plank' then 60 else null end
from seed_workouts sw
join exercise_map em on em.user_id = sw.user_id
where sw.rn <= 2
  and not exists (
    select 1
    from public.workout_exercises we
    where we.workout_id = sw.id
      and we.exercise_name = em.name
  );

-- 4) Announcements.
insert into public.announcements (title, content, is_published, published_at, created_by)
select
  '[SEED] Welcome to GunSelf',
  'This is a seeded announcement for UI and workflow testing.',
  true,
  now() - interval '2 days',
  (select id from public.profiles order by created_at asc limit 1)
where not exists (
  select 1 from public.announcements where title = '[SEED] Welcome to GunSelf'
);

insert into public.announcements (title, content, is_published, published_at, created_by)
select
  '[SEED] Upcoming Feature Rollout',
  'AI Coach Phase 1 preview and dashboard optimization improvements.',
  false,
  null,
  (select id from public.profiles order by created_at asc limit 1)
where not exists (
  select 1 from public.announcements where title = '[SEED] Upcoming Feature Rollout'
);


