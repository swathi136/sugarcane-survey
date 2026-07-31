create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.admin_roles enable row level security;

revoke all on table public.admin_roles from anon, authenticated;
grant all on table public.admin_roles to service_role;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select check_user_id is not null
    and check_user_id = auth.uid()
    and exists (
      select 1
      from public.admin_roles
      where user_id = check_user_id
    );
$$;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

alter table public.field_entries
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists rejection_feedback text,
  add column if not exists rejected_by uuid references auth.users(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_email_sent_at timestamptz;

alter table public.athani_field_entries
  add column if not exists rejection_feedback text,
  add column if not exists rejected_by uuid references auth.users(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_email_sent_at timestamptz;

alter table public.anthiyur_field_entries
  add column if not exists rejection_feedback text,
  add column if not exists rejected_by uuid references auth.users(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_email_sent_at timestamptz;

alter table public.field_entries
  add constraint field_entries_rejection_feedback_check
  check (status <> 'Rejected' or nullif(btrim(rejection_feedback), '') is not null) not valid;

alter table public.athani_field_entries
  add constraint athani_field_entries_rejection_feedback_check
  check (status <> 'Rejected' or nullif(btrim(rejection_feedback), '') is not null) not valid;

alter table public.anthiyur_field_entries
  add constraint anthiyur_field_entries_rejection_feedback_check
  check (status <> 'Rejected' or nullif(btrim(rejection_feedback), '') is not null) not valid;

create policy "Verified admins can read all College entries"
on public.field_entries
for select
to authenticated
using (public.is_admin());

create policy "Verified admins can update College entries"
on public.field_entries
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Verified admins can read all Athani entries"
on public.athani_field_entries
for select
to authenticated
using (public.is_admin());

create policy "Verified admins can update Athani entries"
on public.athani_field_entries
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Verified admins can read all Anthiyur entries"
on public.anthiyur_field_entries
for select
to authenticated
using (public.is_admin());

create policy "Verified admins can update Anthiyur entries"
on public.anthiyur_field_entries
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, update on table public.field_entries to authenticated;
grant select, update on table public.athani_field_entries to authenticated;
grant select, update on table public.anthiyur_field_entries to authenticated;
