create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists admin_audit_logs_admin_select_all on public.admin_audit_logs;
create policy admin_audit_logs_admin_select_all on public.admin_audit_logs
for select using (public.is_admin());

drop policy if exists admin_audit_logs_admin_insert_all on public.admin_audit_logs;
create policy admin_audit_logs_admin_insert_all on public.admin_audit_logs
for insert with check (public.is_admin());

