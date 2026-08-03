create or replace function public.get_biometric_growth_results(
  p_location_id text default 'All',
  p_treatment_id text default 'All',
  p_metric text default 'plant_height_cm'
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
with source as (
  select b.*,
    case p_metric
      when 'plant_height_cm' then plant_height_cm
      when 'number_of_tillers' then number_of_tillers
      when 'number_of_leaves' then number_of_leaves
      when 'leaf_length_cm' then leaf_length_cm
      when 'leaf_breadth_cm' then leaf_breadth_cm
      else null
    end metric_value
  from public.dashboard_biometric_source b
  where (p_location_id='All' or b.location_id=p_location_id)
), filtered as (
  select * from source where (p_treatment_id='All' or treatment_id=p_treatment_id) and metric_value is not null
), summary as (
  select round(coalesce(avg(metric_value),0),2) average,
    round(coalesce(max(metric_value),0),2) highest,
    round(coalesce(min(metric_value),0),2) lowest,
    coalesce(max(observation_day),0) latest_day,count(*) total_records
  from filtered
), trend as (
  select observation_day,round(avg(metric_value),2) value
  from filtered group by observation_day order by observation_day
), comparison as (
  select treatment_id treatment,round(avg(metric_value),2) value
  from source where metric_value is not null and treatment_id is not null
  group by treatment_id order by nullif(regexp_replace(treatment_id,'[^0-9]','','g'),'')::integer nulls last,treatment_id
), latest as (
  select s.location_id,s.plot_id,coalesce(p.plot_name,s.plot_id) plot_label,
    s.treatment_id,s.observation_day,s.metric_value,
    case when s.source_type='csv' then coalesce(base.source_sheet,'CSV baseline') else 'Approved Supabase Entry' end source_sheet
  from filtered s
  left join public.dashboard_plot_master p on p.plot_id=s.plot_id
  left join public.dashboard_biometric_baseline base on base.source_key=s.source_key
  cross join summary
  where s.observation_day=summary.latest_day
  order by nullif(regexp_replace(s.treatment_id,'[^0-9]','','g'),'')::integer nulls last,s.plot_id
  limit 30
)
select jsonb_build_object(
  'summary',(select to_jsonb(summary) from summary),
  'trend',(select coalesce(jsonb_agg(jsonb_build_object('observationDay',observation_day,'day',observation_day||' Day','value',value) order by observation_day),'[]') from trend),
  'treatmentComparison',(select coalesce(jsonb_agg(to_jsonb(comparison)),'[]') from comparison),
  'bestTreatment',(select treatment from comparison order by value desc limit 1),
  'latestRows',(select coalesce(jsonb_agg(to_jsonb(latest)),'[]') from latest),
  'treatments',(select coalesce(jsonb_agg(treatment order by nullif(regexp_replace(treatment,'[^0-9]','','g'),'')::integer nulls last,treatment),'[]') from (select distinct treatment_id treatment from source where treatment_id is not null) options)
);
$$;

create or replace function public.get_fertigation_tracking_results(
  p_location_id text default 'All',
  p_treatment_id text default 'All'
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
with source as (
  select * from public.dashboard_fertigation_source f
  where (p_location_id='All' or f.location_id=p_location_id)
), filtered as (
  select * from source where p_treatment_id='All' or treatment_id=p_treatment_id
), summary as (
  select count(*) total_records,count(distinct treatment_id) total_treatments,count(distinct plot_id) total_plots,
    round(coalesce(sum(n_kg),0),2) total_n,round(coalesce(sum(p2o5_kg),0),2) total_p,
    round(coalesce(sum(k2o_kg),0),2) total_k,round(coalesce(sum(urea_kg),0),2) total_urea,
    round(coalesce(sum(white_potash_kg),0),2) total_potash
  from filtered
), trend as (
  select day_after_planting,round(sum(coalesce(n_kg,0)),2) n_kg,
    round(sum(coalesce(p2o5_kg,0)),2) p_kg,round(sum(coalesce(k2o_kg,0)),2) k_kg
  from filtered group by day_after_planting order by day_after_planting
), usage as (
  select round(coalesce(sum(urea_kg),0),2) urea,round(coalesce(sum(dap_kg),0),2) dap,
    round(coalesce(sum(map_kg),0),2) map,round(coalesce(sum(white_potash_kg),0),2) potash,
    round(coalesce(sum(mn_mixture_kg),0),2) mn from filtered
), schedule as (
  select location_id,plot_id,treatment_id,day_after_planting,date,n_kg,p2o5_kg,k2o_kg,
    mn_mixture_kg,urea_kg,dap_kg,map_kg,white_potash_kg
  from filtered order by day_after_planting,plot_id limit 60
)
select jsonb_build_object(
  'summary',(select to_jsonb(summary) from summary),
  'trend',(select coalesce(jsonb_agg(jsonb_build_object('dayAfterPlanting',day_after_planting,'day',day_after_planting||' Day','nKg',n_kg,'pKg',p_kg,'kKg',k_kg) order by day_after_planting),'[]') from trend),
  'usage',(select jsonb_build_array(
    jsonb_build_object('fertilizer','Urea','quantity',urea),jsonb_build_object('fertilizer','DAP','quantity',dap),
    jsonb_build_object('fertilizer','MAP','quantity',map),jsonb_build_object('fertilizer','White Potash','quantity',potash),
    jsonb_build_object('fertilizer','MN Mixture','quantity',mn)
  ) from usage),
  'scheduleRows',(select coalesce(jsonb_agg(to_jsonb(schedule)),'[]') from schedule),
  'treatments',(select coalesce(jsonb_agg(treatment order by nullif(regexp_replace(treatment,'[^0-9]','','g'),'')::integer nulls last,treatment),'[]') from (select distinct treatment_id treatment from source where treatment_id is not null) options)
);
$$;

revoke all on function public.get_biometric_growth_results(text,text,text) from public;
revoke all on function public.get_fertigation_tracking_results(text,text) from public;
grant execute on function public.get_biometric_growth_results(text,text,text) to anon,authenticated;
grant execute on function public.get_fertigation_tracking_results(text,text) to anon,authenticated;

create or replace function public.strip_large_embedded_schedule()
returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
  new.results:=new.results #- '{fertigationTracking,scheduleRows}';
  return new;
end;
$$;
drop trigger if exists zz_strip_large_schedule_current on public.dashboard_current_results;
create trigger zz_strip_large_schedule_current before insert or update on public.dashboard_current_results
for each row execute function public.strip_large_embedded_schedule();
drop trigger if exists zz_strip_large_schedule_snapshot on public.dashboard_calculation_snapshots;
create trigger zz_strip_large_schedule_snapshot before insert or update on public.dashboard_calculation_snapshots
for each row execute function public.strip_large_embedded_schedule();
update public.dashboard_current_results set results=results #- '{fertigationTracking,scheduleRows}';
update public.dashboard_calculation_snapshots set results=results #- '{fertigationTracking,scheduleRows}' where calculation_version='server-1.0.0';
