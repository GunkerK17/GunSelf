-- Add ban flags for admin moderation flow.

alter table public.profiles
add column if not exists is_banned boolean not null default false,
add column if not exists banned_at timestamptz,
add column if not exists ban_reason text;

