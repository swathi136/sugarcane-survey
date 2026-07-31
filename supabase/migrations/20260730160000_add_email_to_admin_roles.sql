alter table public.admin_roles
  add column if not exists email text;

update public.admin_roles as admin_role
set email = auth_user.email
from auth.users as auth_user
where auth_user.id = admin_role.user_id;

alter table public.admin_roles
  alter column email set not null;

create unique index if not exists admin_roles_email_unique_idx
on public.admin_roles (lower(email));

create or replace function public.sync_admin_role_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  select auth_user.email
  into new.email
  from auth.users as auth_user
  where auth_user.id = new.user_id;

  if new.email is null then
    raise exception 'The admin role must reference a Supabase Auth user with an email address.';
  end if;

  return new;
end;
$$;

revoke all on function public.sync_admin_role_email() from public, anon, authenticated;

drop trigger if exists sync_admin_role_email_trigger on public.admin_roles;

create trigger sync_admin_role_email_trigger
before insert or update of user_id, email
on public.admin_roles
for each row
execute function public.sync_admin_role_email();
