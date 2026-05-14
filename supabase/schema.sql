-- GunSelf initial schema
-- Run with Supabase SQL editor or migration tool.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text,
  created_at timestamptz not null default now()
);

create table if not exists public.body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,2),
  body_fat_percent numeric(5,2),
  note text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  duration_minutes integer,
  calories_burned integer,
  note text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  muscle_group text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercise_library(id) on delete set null,
  exercise_name text not null,
  sets integer,
  reps integer,
  weight_kg numeric(6,2),
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text,
  title text not null,
  calories integer,
  protein_g numeric(7,2),
  carbs_g numeric(7,2),
  fat_g numeric(7,2),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  duration_minutes integer,
  distance_km numeric(8,2),
  steps integer,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sleep_start timestamptz,
  sleep_end timestamptz,
  duration_minutes integer,
  quality_score integer,
  created_at timestamptz not null default now()
);

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_score integer,
  energy_score integer,
  stress_score integer,
  journal_note text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  target_value numeric(12,2),
  current_value numeric(12,2),
  unit text,
  status text default 'active',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  duration_minutes integer,
  level text,
  note text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.finance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  category text,
  amount numeric(12,2) not null,
  currency text default 'USD',
  note text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null,
  context text,
  created_at timestamptz not null default now()
);

-- Optional auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.body_logs enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.exercise_library enable row level security;
alter table public.meals enable row level security;
alter table public.activity_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.mood_logs enable row level security;
alter table public.goals enable row level security;
alter table public.skill_logs enable row level security;
alter table public.finance_logs enable row level security;
alter table public.ai_notes enable row level security;

-- Profiles policies
create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
for insert with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_delete_own" on public.profiles
for delete using (id = auth.uid());

-- User-owned tables policies
create policy "body_logs_select_own" on public.body_logs
for select using (user_id = auth.uid());
create policy "body_logs_insert_own" on public.body_logs
for insert with check (user_id = auth.uid());
create policy "body_logs_update_own" on public.body_logs
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "body_logs_delete_own" on public.body_logs
for delete using (user_id = auth.uid());

create policy "workouts_select_own" on public.workouts
for select using (user_id = auth.uid());
create policy "workouts_insert_own" on public.workouts
for insert with check (user_id = auth.uid());
create policy "workouts_update_own" on public.workouts
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workouts_delete_own" on public.workouts
for delete using (user_id = auth.uid());

create policy "workout_exercises_select_own" on public.workout_exercises
for select using (user_id = auth.uid());
create policy "workout_exercises_insert_own" on public.workout_exercises
for insert with check (user_id = auth.uid());
create policy "workout_exercises_update_own" on public.workout_exercises
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workout_exercises_delete_own" on public.workout_exercises
for delete using (user_id = auth.uid());

create policy "exercise_library_select_own" on public.exercise_library
for select using (user_id = auth.uid());
create policy "exercise_library_insert_own" on public.exercise_library
for insert with check (user_id = auth.uid());
create policy "exercise_library_update_own" on public.exercise_library
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "exercise_library_delete_own" on public.exercise_library
for delete using (user_id = auth.uid());

create policy "meals_select_own" on public.meals
for select using (user_id = auth.uid());
create policy "meals_insert_own" on public.meals
for insert with check (user_id = auth.uid());
create policy "meals_update_own" on public.meals
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "meals_delete_own" on public.meals
for delete using (user_id = auth.uid());

create policy "activity_logs_select_own" on public.activity_logs
for select using (user_id = auth.uid());
create policy "activity_logs_insert_own" on public.activity_logs
for insert with check (user_id = auth.uid());
create policy "activity_logs_update_own" on public.activity_logs
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "activity_logs_delete_own" on public.activity_logs
for delete using (user_id = auth.uid());

create policy "sleep_logs_select_own" on public.sleep_logs
for select using (user_id = auth.uid());
create policy "sleep_logs_insert_own" on public.sleep_logs
for insert with check (user_id = auth.uid());
create policy "sleep_logs_update_own" on public.sleep_logs
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sleep_logs_delete_own" on public.sleep_logs
for delete using (user_id = auth.uid());

create policy "mood_logs_select_own" on public.mood_logs
for select using (user_id = auth.uid());
create policy "mood_logs_insert_own" on public.mood_logs
for insert with check (user_id = auth.uid());
create policy "mood_logs_update_own" on public.mood_logs
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "mood_logs_delete_own" on public.mood_logs
for delete using (user_id = auth.uid());

create policy "goals_select_own" on public.goals
for select using (user_id = auth.uid());
create policy "goals_insert_own" on public.goals
for insert with check (user_id = auth.uid());
create policy "goals_update_own" on public.goals
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_delete_own" on public.goals
for delete using (user_id = auth.uid());

create policy "skill_logs_select_own" on public.skill_logs
for select using (user_id = auth.uid());
create policy "skill_logs_insert_own" on public.skill_logs
for insert with check (user_id = auth.uid());
create policy "skill_logs_update_own" on public.skill_logs
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "skill_logs_delete_own" on public.skill_logs
for delete using (user_id = auth.uid());

create policy "finance_logs_select_own" on public.finance_logs
for select using (user_id = auth.uid());
create policy "finance_logs_insert_own" on public.finance_logs
for insert with check (user_id = auth.uid());
create policy "finance_logs_update_own" on public.finance_logs
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "finance_logs_delete_own" on public.finance_logs
for delete using (user_id = auth.uid());

create policy "ai_notes_select_own" on public.ai_notes
for select using (user_id = auth.uid());
create policy "ai_notes_insert_own" on public.ai_notes
for insert with check (user_id = auth.uid());
create policy "ai_notes_update_own" on public.ai_notes
for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_notes_delete_own" on public.ai_notes
for delete using (user_id = auth.uid());
