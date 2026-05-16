-- Add user contact identity fields for admin management view.

alter table public.profiles
add column if not exists email text,
add column if not exists phone text;

-- Backfill from auth.users for existing rows.
update public.profiles p
set
  email = u.email,
  phone = u.phone,
  display_name = coalesce(p.display_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
from auth.users u
where p.id = u.id;

-- Keep profile auto-create aligned for future users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

