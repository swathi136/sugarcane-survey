create or replace function public.calculate_dashboard_component_details(p_location_id text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
with
b as (select * from public.dashboard_biometric_calculation_source where location_id=p_location_id),
f as (select * from public.dashboard_fertigation_calculation_source where location_id=p_location_id),
metric_series as (
  select treatment_id, observation_day,
    count(plant_height_cm) height_count, round(avg(plant_height_cm),2) avg_height, min(plant_height_cm) min_height, max(plant_height_cm) max_height,
    count(number_of_tillers) tiller_count, round(avg(number_of_tillers),2) avg_tillers, min(number_of_tillers) min_tillers, max(number_of_tillers) max_tillers,
    count(number_of_leaves) leaves_count, round(avg(number_of_leaves),2) avg_leaves, min(number_of_leaves) min_leaves, max(number_of_leaves) max_leaves,
    count(leaf_length_cm) leaf_length_count, round(avg(leaf_length_cm),2) avg_leaf_length, min(leaf_length_cm) min_leaf_length, max(leaf_length_cm) max_leaf_length,
    count(leaf_breadth_cm) leaf_breadth_count, round(avg(leaf_breadth_cm),2) avg_leaf_breadth, min(leaf_breadth_cm) min_leaf_breadth, max(leaf_breadth_cm) max_leaf_breadth
  from b group by treatment_id,observation_day
),
latest_all as (
  select * from b where observation_day=(select max(observation_day) from b)
  order by treatment_id,plot_id limit 30
),
latest_treatment as (
  select * from (
    select b.*, max(observation_day) over(partition by treatment_id) treatment_latest_day,
      row_number() over(partition by treatment_id order by plot_id,source_key) row_number
    from b
  ) ranked where observation_day=treatment_latest_day and row_number<=30
),
fert_series as (
  select treatment_id,day_after_planting,count(*) record_count,
    round(sum(coalesce(n_kg,0)),2) n_kg,round(sum(coalesce(p2o5_kg,0)),2) p2o5_kg,
    round(sum(coalesce(k2o_kg,0)),2) k2o_kg,round(sum(coalesce(mn_mixture_kg,0)),2) mn_mixture_kg,
    round(sum(coalesce(urea_kg,0)),2) urea_kg,round(sum(coalesce(map_kg,0)),2) map_kg,
    round(sum(coalesce(dap_kg,0)),2) dap_kg,round(sum(coalesce(white_potash_kg,0)),2) white_potash_kg
  from f group by treatment_id,day_after_planting
),
schedule_all as (
  select 'All'::text scope,f.* from f order by day_after_planting,plot_id limit 60
),
schedule_treatment as (
  select treatment_id scope,source_type,source_key,source_row_id,location_id,plot_id,treatment_id,
    day_after_planting,date,n_kg,p2o5_kg,k2o_kg,mn_mixture_kg,urea_kg,map_kg,dap_kg,white_potash_kg
  from (select f.*,row_number() over(partition by treatment_id order by day_after_planting,plot_id,source_key) rn from f) ranked
  where rn<=60
),
stats as (select avg(plant_height_cm) avg_height,avg(number_of_tillers) avg_tillers,max(observation_day) latest_day from b),
alert_rows as (
  select jsonb_build_object('type','Low Growth','priority',case when plant_height_cm<s.avg_height*.6 then 'High' else 'Medium' end,'location',coalesce((select orig.location_id from public.dashboard_biometric_source orig where orig.source_key=b.source_key limit 1),b.location_id),'plot',b.plot_id,'treatment',b.treatment_id,'message',b.plot_id||' shows low plant height compared to selected average.','reason','Plant height '||plant_height_cm||' cm is below the expected average range.','action','Mark for field inspection and verify crop condition.') item,1 ordering
  from b cross join stats s where plant_height_cm<s.avg_height*.75 order by plant_height_cm limit 20
),
weak_alerts as (
  select jsonb_build_object('type','Weak Tillering','priority','Medium','location',coalesce((select orig.location_id from public.dashboard_biometric_source orig where orig.source_key=b.source_key limit 1),b.location_id),'plot',b.plot_id,'treatment',b.treatment_id,'message',b.plot_id||' has lower tiller count than average.','reason','Tillers count '||number_of_tillers||' is below normal comparison level.','action','Review treatment response and field growth status.') item,2 ordering
  from b cross join stats s where number_of_tillers<s.avg_tillers*.7 order by number_of_tillers limit 15
),
missing_alerts as (
  select jsonb_build_object('type','Missing Entry','priority','Low','location',coalesce((select orig.location_id from public.dashboard_plot_master orig where orig.plot_id=p.plot_id limit 1),p.location_id),'plot',p.plot_name,'treatment',p.treatment_id,'message',p.plot_name||' has no record for latest observation day.','reason','Latest available observation day is '||s.latest_day||', but this plot is not found.','action','Ask field official to verify and update monthly observation entry.') item,3 ordering
  from public.dashboard_plot_calculation_source p cross join stats s
  where p.location_id=p_location_id and not exists(select 1 from b where b.plot_id=p.plot_id and b.observation_day=s.latest_day)
),
fert_alerts as (
  select jsonb_build_object('type','Fertigation Attention','priority','Medium','location',coalesce((select orig.location_id from public.dashboard_fertigation_source orig where orig.source_key=f.source_key limit 1),f.location_id),'plot',f.plot_id,'treatment',f.treatment_id,'message','Fertigation entry needs review for '||f.plot_id||'.','reason','N and K2O values are empty or zero for day '||f.day_after_planting||'.','action','Check whether this is planned zero dose or data entry issue.') item,4 ordering
  from f where coalesce(n_kg,0)=0 and coalesce(k2o_kg,0)=0 order by day_after_planting limit 15
),
all_alerts as (select * from alert_rows union all select * from weak_alerts union all select * from missing_alerts union all select * from fert_alerts),
bio_quality as (
  select column_name,total,available,total-available missing,case when total=0 then 0 else round(available::numeric/total*100,1) end completeness
  from (select count(*) total,count(plant_height_cm) plant_height_cm,count(number_of_tillers) number_of_tillers,count(number_of_leaves) number_of_leaves,count(leaf_length_cm) leaf_length_cm,count(leaf_breadth_cm) leaf_breadth_cm,count(observation_day) observation_day,count(date_of_observation) date_of_observation,count(cane_girth_cm) cane_girth_cm,count(germination_pct) germination_pct,count(millable_cane_count) millable_cane_count,count(plant_count_1m) plant_count_1m from b) counts
  cross join lateral (values ('plant_height_cm',plant_height_cm),('number_of_tillers',number_of_tillers),('number_of_leaves',number_of_leaves),('leaf_length_cm',leaf_length_cm),('leaf_breadth_cm',leaf_breadth_cm),('observation_day',observation_day),('date_of_observation',date_of_observation),('cane_girth_cm',cane_girth_cm),('germination_pct',germination_pct),('millable_cane_count',millable_cane_count),('plant_count_1m',plant_count_1m)) fields(column_name,available)
),
fert_quality as (
  select column_name,total,available,total-available missing,case when total=0 then 0 else round(available::numeric/total*100,1) end completeness
  from (select count(*) total,count(day_after_planting) day_after_planting,count(date) date,count(n_kg) n_kg,count(p2o5_kg) p2o5_kg,count(k2o_kg) k2o_kg,count(urea_kg) urea_kg,count(dap_kg) dap_kg,count(map_kg) map_kg,count(white_potash_kg) white_potash_kg,count(mn_mixture_kg) mn_mixture_kg from f) counts
  cross join lateral (values ('day_after_planting',day_after_planting),('date',date),('n_kg',n_kg),('p2o5_kg',p2o5_kg),('k2o_kg',k2o_kg),('urea_kg',urea_kg),('dap_kg',dap_kg),('map_kg',map_kg),('white_potash_kg',white_potash_kg),('mn_mixture_kg',mn_mixture_kg)) fields(column_name,available)
),
location_summary as (
  select location_id,count(*) records,round(avg(plant_height_cm),1) avg_height,round(avg(number_of_tillers),1) avg_tillers,max(observation_day) latest_day
  from public.dashboard_biometric_source
  where p_location_id='All' or location_id=p_location_id group by location_id
),
report_treatments as (
  select location_id,treatment_id treatment,count(*) records,round(avg(plant_height_cm),1) avg_height,round(avg(number_of_tillers),1) avg_tillers,round(avg(number_of_leaves),1) avg_leaves
  from public.dashboard_biometric_source
  where p_location_id='All' or location_id=p_location_id group by location_id,treatment_id order by avg_height desc limit 10
)
select jsonb_build_object(
  'biometricGrowth',jsonb_build_object(
    'metricSeries',(select coalesce(jsonb_agg(to_jsonb(metric_series) order by treatment_id,observation_day),'[]') from metric_series),
    'latestRowsAll',(select coalesce(jsonb_agg(to_jsonb(latest_all)),'[]') from latest_all),
    'latestRowsByTreatment',(select coalesce(jsonb_agg(to_jsonb(latest_treatment) order by treatment_id,plot_id),'[]') from latest_treatment)
  ),
  'fertigationTracking',jsonb_build_object(
    'treatmentDayTotals',(select coalesce(jsonb_agg(to_jsonb(fert_series) order by treatment_id,day_after_planting),'[]') from fert_series),
    'scheduleRows',(select coalesce(jsonb_agg(to_jsonb(rows) order by scope,day_after_planting),'[]') from (select * from schedule_all union all select * from schedule_treatment) rows)
  ),
  'smartAlerts',jsonb_build_object('alerts',(select coalesce(jsonb_agg(item order by ordering),'[]') from all_alerts)),
  'dataQuality',jsonb_build_object(
    'biometricColumns',(select coalesce(jsonb_agg(to_jsonb(bio_quality)),'[]') from bio_quality),
    'fertigationColumns',(select coalesce(jsonb_agg(to_jsonb(fert_quality)),'[]') from fert_quality)
  ),
  'reports',jsonb_build_object(
    'locationSummary',(select coalesce(jsonb_agg(to_jsonb(location_summary) order by location_id),'[]') from location_summary),
    'treatmentRanking',(select coalesce(jsonb_agg(to_jsonb(report_treatments) order by avg_height desc),'[]') from report_treatments)
  )
);
$$;

create or replace function public.enrich_dashboard_result()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare details jsonb;
begin
  details:=public.calculate_dashboard_component_details(new.location_id);
  new.results:=new.results||jsonb_build_object(
    'biometricGrowth',coalesce(new.results->'biometricGrowth','{}')||coalesce(details->'biometricGrowth','{}'),
    'fertigationTracking',coalesce(new.results->'fertigationTracking','{}')||coalesce(details->'fertigationTracking','{}'),
    'smartAlerts',coalesce(new.results->'smartAlerts','{}')||coalesce(details->'smartAlerts','{}'),
    'dataQuality',coalesce(new.results->'dataQuality','{}')||coalesce(details->'dataQuality','{}'),
    'reports',coalesce(new.results->'reports','{}')||coalesce(details->'reports','{}')
  );
  return new;
end;
$$;

drop trigger if exists enrich_dashboard_current_result_before_write on public.dashboard_current_results;
create trigger enrich_dashboard_current_result_before_write before insert or update on public.dashboard_current_results
for each row execute function public.enrich_dashboard_result();
drop trigger if exists enrich_dashboard_snapshot_before_write on public.dashboard_calculation_snapshots;
create trigger enrich_dashboard_snapshot_before_write before insert or update on public.dashboard_calculation_snapshots
for each row when (new.calculation_version='server-1.0.0') execute function public.enrich_dashboard_result();

select public.refresh_dashboard_current_results('L001');
select public.refresh_dashboard_current_results('L002');
select public.refresh_dashboard_current_results('L003');
select public.refresh_dashboard_current_results('All');
