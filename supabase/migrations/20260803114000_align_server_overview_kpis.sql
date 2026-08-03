create or replace function public.align_dashboard_current_result()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  new.results := jsonb_set(new.results, '{overview,totalLocations}', '3'::jsonb, true);
  new.results := jsonb_set(
    new.results,
    '{overview,openAlerts}',
    coalesce(new.results #> '{smartAlerts,lowGrowth}', '0'::jsonb),
    true
  );
  return new;
end;
$$;

drop trigger if exists align_dashboard_current_result_before_write
on public.dashboard_current_results;
create trigger align_dashboard_current_result_before_write
before insert or update on public.dashboard_current_results
for each row execute function public.align_dashboard_current_result();

create or replace function public.align_dashboard_snapshot_result()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  new.results := jsonb_set(new.results, '{overview,totalLocations}', '3'::jsonb, true);
  new.results := jsonb_set(
    new.results,
    '{overview,openAlerts}',
    coalesce(new.results #> '{smartAlerts,lowGrowth}', '0'::jsonb),
    true
  );
  return new;
end;
$$;

drop trigger if exists align_dashboard_snapshot_result_before_write
on public.dashboard_calculation_snapshots;
create trigger align_dashboard_snapshot_result_before_write
before insert or update on public.dashboard_calculation_snapshots
for each row execute function public.align_dashboard_snapshot_result();

update public.dashboard_current_results
set results = jsonb_set(
  jsonb_set(results, '{overview,totalLocations}', '3'::jsonb, true),
  '{overview,openAlerts}', coalesce(results #> '{smartAlerts,lowGrowth}', '0'::jsonb), true
);

update public.dashboard_calculation_snapshots
set results = jsonb_set(
  jsonb_set(results, '{overview,totalLocations}', '3'::jsonb, true),
  '{overview,openAlerts}', coalesce(results #> '{smartAlerts,lowGrowth}', '0'::jsonb), true
)
where calculation_version = 'server-1.0.0';
