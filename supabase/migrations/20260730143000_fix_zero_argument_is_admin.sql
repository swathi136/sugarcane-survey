create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

insert into public.admin_roles (user_id, created_by)
select id, id
from auth.users
where lower(email) = lower('srinidhi.24cs@kct.ac.in')
on conflict (user_id) do nothing;

notify pgrst, 'reload schema';
