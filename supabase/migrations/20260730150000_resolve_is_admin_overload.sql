alter function public.is_admin(uuid) rename to is_admin_for_user;

revoke all on function public.is_admin_for_user(uuid) from public, anon;
grant execute on function public.is_admin_for_user(uuid) to authenticated, service_role;

insert into public.admin_roles (user_id, created_by)
select id, id
from auth.users
where lower(email) = lower('swathi.24cs@kct.ac.in')
on conflict (user_id) do nothing;

notify pgrst, 'reload schema';
