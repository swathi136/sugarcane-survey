create table if not exists public.dashboard_calculation_snapshots (
  id uuid primary key default gen_random_uuid(),
  location_id text not null check (location_id in ('L001', 'L002', 'L003')),
  location_name text not null,
  source_signature text not null,
  approved_row_count integer not null check (approved_row_count >= 0),
  approved_row_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(approved_row_ids) = 'array'),
  calculation_version text not null,
  results jsonb not null check (jsonb_typeof(results) = 'object'),
  calculated_by uuid not null references auth.users(id),
  calculated_at timestamptz not null default now(),
  unique (location_id, source_signature, calculation_version)
);

alter table public.dashboard_calculation_snapshots enable row level security;
revoke all on table public.dashboard_calculation_snapshots from anon, authenticated;
grant select on table public.dashboard_calculation_snapshots to authenticated;

create policy "Admins can read calculation snapshots"
on public.dashboard_calculation_snapshots for select to authenticated
using (public.is_admin());

create or replace function public.save_dashboard_calculation_snapshot(
  p_location_id text,
  p_location_name text,
  p_source_signature text,
  p_approved_row_count integer,
  p_approved_row_ids jsonb,
  p_calculation_version text,
  p_results jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  snapshot_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_location_id not in ('L001', 'L002', 'L003') then
    raise exception 'Invalid location';
  end if;
  if jsonb_typeof(p_results) <> 'object' or jsonb_typeof(p_approved_row_ids) <> 'array' then
    raise exception 'Invalid snapshot payload';
  end if;

  select id into snapshot_id
  from public.dashboard_calculation_snapshots
  where location_id = p_location_id
    and source_signature = p_source_signature
    and calculation_version = p_calculation_version;

  if snapshot_id is not null then
    return snapshot_id;
  end if;

  insert into public.dashboard_calculation_snapshots (
    location_id, location_name, source_signature, approved_row_count,
    approved_row_ids, calculation_version, results, calculated_by
  ) values (
    p_location_id, p_location_name, p_source_signature, p_approved_row_count,
    p_approved_row_ids, p_calculation_version, p_results, auth.uid()
  )
  on conflict (location_id, source_signature, calculation_version) do nothing
  returning id into snapshot_id;

  if snapshot_id is null then
    select id into snapshot_id
    from public.dashboard_calculation_snapshots
    where location_id = p_location_id
      and source_signature = p_source_signature
      and calculation_version = p_calculation_version;
  end if;

  return snapshot_id;
end;
$$;

revoke all on function public.save_dashboard_calculation_snapshot(text, text, text, integer, jsonb, text, jsonb) from public;
grant execute on function public.save_dashboard_calculation_snapshot(text, text, text, integer, jsonb, text, jsonb) to authenticated;
