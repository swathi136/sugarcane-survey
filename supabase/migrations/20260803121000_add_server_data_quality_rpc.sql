create or replace function public.get_dashboard_data_quality_results(p_location_id text default 'All')
returns jsonb
language sql
stable
security definer
set search_path=pg_catalog,public,pg_temp
as $$
with b as (
  select src.*,
    coalesce(base.replication,plot.replication) replication,
    coalesce(base.plot_label,plot.plot_name) plot_label
  from public.dashboard_biometric_source src
  left join public.dashboard_biometric_baseline base on base.source_key=src.source_key
  left join public.dashboard_plot_master plot on plot.plot_id=src.plot_id
  where p_location_id='All' or src.location_id=p_location_id
), f as (
  select * from public.dashboard_fertigation_source src
  where p_location_id='All' or src.location_id=p_location_id
), bio_counts as (
  select count(*) total,count(location_id) location_id,count(plot_id) plot_id,count(treatment_id) treatment_id,
    count(replication) replication,count(plot_label) plot_label,count(observation_day) observation_day,
    count(date_of_observation) date_of_observation,count(plant_count_1m) plant_count_1m,
    count(plant_count_5m) plant_count_5m,count(plant_count_15m) plant_count_15m,
    count(number_of_tillers) number_of_tillers,count(number_of_leaves) number_of_leaves,
    count(plant_height_cm) plant_height_cm,count(leaf_length_cm) leaf_length_cm,
    count(leaf_breadth_cm) leaf_breadth_cm,count(number_of_node) number_of_node,
    count(node_length_cm) node_length_cm,count(millable_cane_count) millable_cane_count,
    count(cane_girth_cm) cane_girth_cm,count(germination_pct) germination_pct from b
), bio_quality as (
  select column_name,total,available,total-available missing,
    case when total=0 then 0 else round(available::numeric/total*100,1) end completeness
  from bio_counts cross join lateral(values
    ('location_id',location_id),('plot_id',plot_id),('treatment_id',treatment_id),('replication',replication),
    ('plot_label',plot_label),('observation_day',observation_day),('date_of_observation',date_of_observation),
    ('plant_count_1m',plant_count_1m),('plant_count_5m',plant_count_5m),('plant_count_15m',plant_count_15m),
    ('number_of_tillers',number_of_tillers),('number_of_leaves',number_of_leaves),('plant_height_cm',plant_height_cm),
    ('leaf_length_cm',leaf_length_cm),('leaf_breadth_cm',leaf_breadth_cm),('number_of_node',number_of_node),
    ('node_length_cm',node_length_cm),('millable_cane_count',millable_cane_count),('cane_girth_cm',cane_girth_cm),
    ('germination_pct',germination_pct)
  ) fields(column_name,available)
), fert_counts as (
  select count(*) total,count(location_id) location_id,count(plot_id) plot_id,count(treatment_id) treatment_id,
    count(day_after_planting) day_after_planting,count(date) date,count(n_kg) n_kg,count(p2o5_kg) p2o5_kg,
    count(k2o_kg) k2o_kg,count(urea_kg) urea_kg,count(dap_kg) dap_kg,count(map_kg) map_kg,
    count(white_potash_kg) white_potash_kg,count(mn_mixture_kg) mn_mixture_kg from f
), fert_quality as (
  select column_name,total,available,total-available missing,
    case when total=0 then 0 else round(available::numeric/total*100,1) end completeness
  from fert_counts cross join lateral(values
    ('location_id',location_id),('plot_id',plot_id),('treatment_id',treatment_id),('day_after_planting',day_after_planting),
    ('date',date),('n_kg',n_kg),('p2o5_kg',p2o5_kg),('k2o_kg',k2o_kg),('urea_kg',urea_kg),
    ('dap_kg',dap_kg),('map_kg',map_kg),('white_potash_kg',white_potash_kg),('mn_mixture_kg',mn_mixture_kg)
  ) fields(column_name,available)
), coverage as (
  select location_id,count(*) records,
    round(count(plant_height_cm)::numeric/count(*)*100,1) height_completeness,
    round(count(number_of_tillers)::numeric/count(*)*100,1) tillers_completeness,
    round(count(number_of_leaves)::numeric/count(*)*100,1) leaves_completeness,
    max(observation_day) latest_day
  from b group by location_id
), summary as (
  select
    (select count(*) from b) biometric_records,(select count(*) from f) fertigation_records,
    (select round(avg(completeness),1) from bio_quality) biometric_completeness,
    (select round(avg(completeness),1) from fert_quality) fertigation_completeness,
    (select count(*) from bio_quality where completeness>=70) strong_columns,
    (select count(*) from bio_quality where completeness<40) weak_columns
)
select jsonb_build_object(
  'biometricColumns',(select jsonb_agg(to_jsonb(bio_quality)) from bio_quality),
  'fertigationColumns',(select jsonb_agg(to_jsonb(fert_quality)) from fert_quality),
  'locationCoverage',(select coalesce(jsonb_agg(to_jsonb(coverage) order by location_id),'[]') from coverage),
  'summary',(select to_jsonb(summary) from summary)
);
$$;

revoke all on function public.get_dashboard_data_quality_results(text) from public;
grant execute on function public.get_dashboard_data_quality_results(text) to anon,authenticated;
