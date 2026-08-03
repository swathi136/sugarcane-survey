-- Security boundary: raw Anthiyur rows remain recorder-owned/admin-only.
-- Public dashboards receive only fixed Approved analytics columns through this RPC.
drop policy if exists "Dashboard can read approved Anthiyur entries"
on public.anthiyur_field_entries;

revoke all privileges on public.anthiyur_field_entries from anon;

create or replace function public.get_approved_anthiyur_dashboard_data()
returns table (
  id uuid, location_code text, location_name text, plot text, treatment text,
  treatment_name text, observation_day integer, date_of_obs date,
  plant_height numeric, tiller_count integer, leaf_count integer,
  leaf_height numeric, leaf_breath numeric, number_of_nodes integer,
  node_length numeric, millable_cane_count_1m integer, plant_count_1m integer,
  fertigation_date date, n_kg numeric, p2o5_kg numeric, k2o_kg numeric,
  mn_mixture numeric, urea_kg numeric, map_kg numeric, dap_kg numeric,
  white_potash_kg numeric, status text, created_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select
    entry.id, entry.location_code, entry.location_name, entry.plot,
    entry.treatment, entry.treatment_name, entry.observation_day,
    entry.date_of_obs, entry.plant_height, entry.tiller_count,
    entry.leaf_count, entry.leaf_height, entry.leaf_breath,
    entry.number_of_nodes, entry.node_length, entry.millable_cane_count_1m,
    entry.plant_count_1m, entry.fertigation_date, entry.n_kg,
    entry.p2o5_kg, entry.k2o_kg, entry.mn_mixture, entry.urea_kg,
    entry.map_kg, entry.dap_kg, entry.white_potash_kg, entry.status,
    entry.created_at
  from public.anthiyur_field_entries as entry
  where entry.status = 'Approved'
  order by entry.created_at asc, entry.id asc;
$$;

revoke all on function public.get_approved_anthiyur_dashboard_data() from public;
grant execute on function public.get_approved_anthiyur_dashboard_data() to anon, authenticated;

comment on function public.get_approved_anthiyur_dashboard_data()
is 'Read-only Approved Anthiyur analytics boundary. Excludes recorder, approval, rejection, audit and custom JSON fields.';
