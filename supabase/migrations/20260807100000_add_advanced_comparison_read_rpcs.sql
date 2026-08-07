create or replace function public.get_dashboard_comparison_biometric_rows()
returns table (
  location_id text, location_name text, plot_id text, plot_label text,
  treatment_id text, observation_day integer, date_of_observation date,
  plant_height_cm numeric, number_of_tillers numeric, number_of_leaves numeric,
  leaf_length_cm numeric, leaf_breadth_cm numeric, number_of_nodes numeric,
  number_of_node numeric, node_length_cm numeric, millable_cane_count numeric,
  millable_cane_count_1m numeric, plant_count_1m numeric, plant_count_5m numeric,
  plant_count_15m numeric, germination_pct numeric, source_type text
)
language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select source.location_id, location.location_name, source.plot_id,
    coalesce(plot.plot_name, source.plot_id), source.treatment_id,
    source.observation_day, source.date_of_observation, source.plant_height_cm,
    source.number_of_tillers, source.number_of_leaves, source.leaf_length_cm,
    source.leaf_breadth_cm, source.number_of_node, source.number_of_node,
    source.node_length_cm, source.millable_cane_count, source.millable_cane_count,
    source.plant_count_1m, source.plant_count_5m, source.plant_count_15m,
    source.germination_pct, source.source_type
  from public.dashboard_biometric_source source
  left join public.dashboard_location_master location using (location_id)
  left join public.dashboard_plot_master plot
    on plot.location_id = source.location_id and plot.plot_id = source.plot_id
  order by source.location_id, source.plot_id, source.observation_day,
    source.treatment_id, source.source_type;
$$;

comment on function public.get_dashboard_comparison_biometric_rows()
is 'Read-only analytics-safe biometric rows: historical Supabase baseline plus Approved form submissions.';
revoke all on function public.get_dashboard_comparison_biometric_rows() from public;
grant execute on function public.get_dashboard_comparison_biometric_rows() to anon, authenticated;

create or replace function public.get_dashboard_comparison_fertigation_rows()
returns table (
  location_id text, location_name text, plot_id text, plot_label text,
  treatment_id text, day_after_planting integer, date date,
  n_kg numeric, p2o5_kg numeric, k2o_kg numeric, mn_mixture_kg numeric,
  urea_kg numeric, map_kg numeric, dap_kg numeric, white_potash_kg numeric,
  source_type text
)
language sql stable security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select source.location_id, location.location_name, source.plot_id,
    coalesce(plot.plot_name, source.plot_id), source.treatment_id,
    source.day_after_planting, source.date, source.n_kg, source.p2o5_kg,
    source.k2o_kg, source.mn_mixture_kg, source.urea_kg, source.map_kg,
    source.dap_kg, source.white_potash_kg, source.source_type
  from public.dashboard_fertigation_source source
  left join public.dashboard_location_master location using (location_id)
  left join public.dashboard_plot_master plot
    on plot.location_id = source.location_id and plot.plot_id = source.plot_id
  order by source.location_id, source.plot_id, source.day_after_planting,
    source.treatment_id, source.source_type;
$$;

comment on function public.get_dashboard_comparison_fertigation_rows()
is 'Read-only analytics-safe fertigation rows: historical Supabase baseline plus Approved form submissions.';
revoke all on function public.get_dashboard_comparison_fertigation_rows() from public;
grant execute on function public.get_dashboard_comparison_fertigation_rows() to anon, authenticated;

