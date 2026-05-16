alter table public.profiles
add column if not exists is_archived boolean not null default false;

alter table public.profiles
add column if not exists archived_at timestamptz;

alter table public.profiles
add column if not exists archived_reason text;

