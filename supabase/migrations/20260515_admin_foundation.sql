-- Admin foundation: roles, announcements, and admin-read policies.

create extension if not exists "pgcrypto";

alter table public.profiles
add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
    add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end $$;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.announcements enable row level security;

drop policy if exists profiles_admin_select_all on public.profiles;
create policy profiles_admin_select_all on public.profiles
for select using (public.is_admin());

drop policy if exists profiles_admin_update_all on public.profiles;
create policy profiles_admin_update_all on public.profiles
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists body_logs_admin_select_all on public.body_logs;
create policy body_logs_admin_select_all on public.body_logs
for select using (public.is_admin());

drop policy if exists workouts_admin_select_all on public.workouts;
create policy workouts_admin_select_all on public.workouts
for select using (public.is_admin());

drop policy if exists workout_exercises_admin_select_all on public.workout_exercises;
create policy workout_exercises_admin_select_all on public.workout_exercises
for select using (public.is_admin());

drop policy if exists exercise_library_admin_select_all on public.exercise_library;
create policy exercise_library_admin_select_all on public.exercise_library
for select using (public.is_admin());

drop policy if exists exercise_library_admin_write_all on public.exercise_library;
create policy exercise_library_admin_write_all on public.exercise_library
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists meals_admin_select_all on public.meals;
create policy meals_admin_select_all on public.meals
for select using (public.is_admin());

drop policy if exists activity_logs_admin_select_all on public.activity_logs;
create policy activity_logs_admin_select_all on public.activity_logs
for select using (public.is_admin());

drop policy if exists sleep_logs_admin_select_all on public.sleep_logs;
create policy sleep_logs_admin_select_all on public.sleep_logs
for select using (public.is_admin());

drop policy if exists mood_logs_admin_select_all on public.mood_logs;
create policy mood_logs_admin_select_all on public.mood_logs
for select using (public.is_admin());

drop policy if exists goals_admin_select_all on public.goals;
create policy goals_admin_select_all on public.goals
for select using (public.is_admin());

drop policy if exists skill_logs_admin_select_all on public.skill_logs;
create policy skill_logs_admin_select_all on public.skill_logs
for select using (public.is_admin());

drop policy if exists finance_logs_admin_select_all on public.finance_logs;
create policy finance_logs_admin_select_all on public.finance_logs
for select using (public.is_admin());

drop policy if exists ai_notes_admin_select_all on public.ai_notes;
create policy ai_notes_admin_select_all on public.ai_notes
for select using (public.is_admin());

drop policy if exists announcements_select_published on public.announcements;
create policy announcements_select_published on public.announcements
for select using (is_published = true or public.is_admin());

drop policy if exists announcements_admin_manage on public.announcements;
create policy announcements_admin_manage on public.announcements
for all using (public.is_admin()) with check (public.is_admin());

