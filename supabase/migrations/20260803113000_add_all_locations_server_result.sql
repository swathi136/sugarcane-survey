create or replace view public.dashboard_biometric_calculation_source
with (security_invoker = true)
as
select * from public.dashboard_biometric_source
union all
select source_type, source_key, source_row_id, 'All'::text as location_id,
  plot_id, treatment_id, observation_day, date_of_observation,
  plant_count_1m, plant_count_5m, plant_count_15m, number_of_node,
  node_length_cm, millable_cane_count, cane_girth_cm, number_of_tillers,
  number_of_leaves, plant_height_cm, leaf_length_cm, leaf_breadth_cm,
  germination_pct
from public.dashboard_biometric_source;

create or replace view public.dashboard_fertigation_calculation_source
with (security_invoker = true)
as
select * from public.dashboard_fertigation_source
union all
select source_type, source_key, source_row_id, 'All'::text as location_id,
  plot_id, treatment_id, day_after_planting, date, n_kg, p2o5_kg, k2o_kg,
  mn_mixture_kg, urea_kg, map_kg, dap_kg, white_potash_kg
from public.dashboard_fertigation_source;

create or replace view public.dashboard_plot_calculation_source
with (security_invoker = true)
as
select * from public.dashboard_plot_master
union all
select plot_id, 'All', plot_name, replication, treatment_id, extent_acre
from public.dashboard_plot_master;

create or replace view public.dashboard_treatment_calculation_source
with (security_invoker = true)
as
select * from public.dashboard_treatment_master
union all
select 'All', treatment_id, plot_label, treatment_details
from public.dashboard_treatment_master;

alter table public.dashboard_current_results
  drop constraint if exists dashboard_current_results_location_id_check;
alter table public.dashboard_current_results
  add constraint dashboard_current_results_location_id_check
  check (location_id in ('All','L001','L002','L003'));
alter table public.dashboard_calculation_snapshots
  drop constraint if exists dashboard_calculation_snapshots_location_id_check;
alter table public.dashboard_calculation_snapshots
  add constraint dashboard_calculation_snapshots_location_id_check
  check (location_id in ('All','L001','L002','L003'));

do $$
declare
  definition text;
begin
  select pg_get_functiondef('public.calculate_dashboard_location(text)'::regprocedure)
  into definition;
  definition := replace(definition, 'public.dashboard_biometric_source', 'public.dashboard_biometric_calculation_source');
  definition := replace(definition, 'public.dashboard_fertigation_source', 'public.dashboard_fertigation_calculation_source');
  definition := replace(definition, 'public.dashboard_plot_master', 'public.dashboard_plot_calculation_source');
  definition := replace(definition, 'public.dashboard_treatment_master', 'public.dashboard_treatment_calculation_source');
  execute definition;
end;
$$;

create or replace function public.refresh_dashboard_current_results(p_location_id text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  payload jsonb;
  signature text;
  approved_ids jsonb;
  approved_count integer;
  location_label text;
begin
  if p_location_id not in ('All','L001','L002','L003') then raise exception 'Invalid location'; end if;
  payload := public.calculate_dashboard_location(p_location_id);
  select coalesce(jsonb_agg(source_key order by source_key),'[]'::jsonb), count(distinct source_key)
  into approved_ids, approved_count
  from (
    select source_key from public.dashboard_biometric_calculation_source where location_id=p_location_id and source_type='supabase'
    union
    select source_key from public.dashboard_fertigation_calculation_source where location_id=p_location_id and source_type='supabase'
  ) approved;
  signature := md5(approved_ids::text || payload::text || ':server-1.0.0');
  if p_location_id = 'All' then
    location_label := 'All Locations';
  else
    select coalesce(location_short_name,location_name,p_location_id) into location_label
    from public.dashboard_location_master where location_id=p_location_id;
  end if;

  insert into public.dashboard_current_results(location_id,location_name,source_signature,calculation_version,approved_row_count,results,refreshed_at)
  values(p_location_id,location_label,signature,'server-1.0.0',approved_count,payload,now())
  on conflict(location_id) do update set
    location_name=excluded.location_name, source_signature=excluded.source_signature,
    calculation_version=excluded.calculation_version, approved_row_count=excluded.approved_row_count,
    results=excluded.results, refreshed_at=excluded.refreshed_at;

  if approved_count > 0 then
    insert into public.dashboard_calculation_snapshots(
      location_id,location_name,source_signature,approved_row_count,
      approved_row_ids,calculation_version,results,calculated_by
    ) values(
      p_location_id,location_label,signature,approved_count,
      approved_ids,'server-1.0.0',payload,auth.uid()
    ) on conflict(location_id,source_signature,calculation_version) do nothing;
  end if;
end;
$$;

create or replace function public.refresh_dashboard_after_entry_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  affected_location text;
  needs_refresh boolean := false;
begin
  if tg_op = 'DELETE' then
    affected_location := old.location_code;
    needs_refresh := old.status = 'Approved';
  elsif tg_op = 'INSERT' then
    affected_location := new.location_code;
    needs_refresh := new.status = 'Approved';
  else
    affected_location := new.location_code;
    needs_refresh := new.status = 'Approved' or old.status = 'Approved';
  end if;
  if needs_refresh then
    perform public.refresh_dashboard_current_results(affected_location);
    perform public.refresh_dashboard_current_results('All');
  end if;
  return null;
end;
$$;

select public.refresh_dashboard_current_results('L001');
select public.refresh_dashboard_current_results('L002');
select public.refresh_dashboard_current_results('L003');
select public.refresh_dashboard_current_results('All');
