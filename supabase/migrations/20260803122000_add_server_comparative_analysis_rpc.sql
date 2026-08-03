create or replace function public.get_comparative_analysis_results(
  p_location_id text default 'All',
  p_treatment_id text default 'All',
  p_bio_day_min numeric default null,
  p_bio_day_max numeric default null,
  p_fert_day_min numeric default null,
  p_fert_day_max numeric default null
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
with
location_b as (
  select * from public.dashboard_biometric_source b
  where p_location_id='All' or b.location_id=p_location_id
),
location_f as (
  select * from public.dashboard_fertigation_source f
  where p_location_id='All' or f.location_id=p_location_id
),
b as (
  select * from location_b
  where (p_treatment_id='All' or treatment_id=p_treatment_id)
    and (p_bio_day_min is null or observation_day>=p_bio_day_min)
    and (p_bio_day_max is null or observation_day<=p_bio_day_max)
),
f as (
  select * from location_f
  where (p_treatment_id='All' or treatment_id=p_treatment_id)
    and (p_fert_day_min is null or day_after_planting>=p_fert_day_min)
    and (p_fert_day_max is null or day_after_planting<=p_fert_day_max)
),
location_rows as (
  select b.location_id,coalesce(l.location_name,b.location_id) location,count(*) records,
    round(avg(plant_height_cm),2) "avgHeight",round(avg(number_of_tillers),2) "avgTillers",
    round(avg(number_of_leaves),2) "avgLeaves",round(avg(leaf_length_cm),2) "avgLeafLength",
    round(avg(leaf_breadth_cm),2) "avgLeafBreadth",coalesce(max(observation_day),0) "latestDay"
  from b left join public.dashboard_location_master l using(location_id)
  group by b.location_id,l.location_name
),
treatment_base as (
  select b.location_id,coalesce(l.location_name,b.location_id) location,treatment_id treatment,count(*) records,
    round(avg(plant_height_cm),2) "avgHeight",round(avg(number_of_tillers),2) "avgTillers",
    round(avg(number_of_leaves),2) "avgLeaves",round(avg(leaf_length_cm),2) "avgLeafLength",
    round(avg(leaf_breadth_cm),2) "avgLeafBreadth",coalesce(max(observation_day),0) "latestDay"
  from b left join public.dashboard_location_master l using(location_id)
  where treatment_id is not null group by b.location_id,l.location_name,treatment_id
),
maxima as (
  select max("avgHeight") h,max("avgTillers") t,max("avgLeaves") lv,
    max("avgLeafLength") ll,max("avgLeafBreadth") lb from treatment_base
),
treatment_rows as (
  select treatment_base.*,
    round((case when h=0 then 0 else "avgHeight"/h end)*40+
      (case when t=0 then 0 else "avgTillers"/t end)*25+
      (case when lv=0 then 0 else "avgLeaves"/lv end)*15+
      (case when ll=0 then 0 else "avgLeafLength"/ll end)*10+
      (case when lb=0 then 0 else "avgLeafBreadth"/lb end)*10,1) "performanceScore"
  from treatment_base cross join maxima
),
bio_days as (
  select observation_day as "day",count(*) records,round(avg(plant_height_cm),2) "avgHeight",
    round(avg(number_of_tillers),2) "avgTillers",round(avg(number_of_leaves),2) "avgLeaves",
    round(avg(leaf_length_cm),2) "avgLeafLength",round(avg(leaf_breadth_cm),2) "avgLeafBreadth"
  from b where observation_day is not null group by observation_day
),
fert_days as (
  select day_after_planting as "day",count(*) records,round(sum(coalesce(n_kg,0)),2) n,
    round(sum(coalesce(p2o5_kg,0)),2) p,round(sum(coalesce(k2o_kg,0)),2) k,
    round(sum(coalesce(urea_kg,0)),2) urea,round(sum(coalesce(dap_kg,0)),2) dap,
    round(sum(coalesce(map_kg,0)),2) map,round(sum(coalesce(white_potash_kg,0)),2) potash
  from f where day_after_planting is not null group by day_after_planting
),
growth as (
  select location_id,treatment_id,round(avg(plant_height_cm),2) "avgHeight",
    round(avg(number_of_tillers),2) "avgTillers" from b
  where treatment_id is not null group by location_id,treatment_id
),
nutrients as (
  select location_id,treatment_id,round(sum(coalesce(n_kg,0)),2) "totalN",
    round(sum(coalesce(p2o5_kg,0)),2) "totalP",round(sum(coalesce(k2o_kg,0)),2) "totalK"
  from f where treatment_id is not null group by location_id,treatment_id
),
nutrient_growth as (
  select coalesce(l.location_name,g.location_id) location,g.treatment_id treatment,
    coalesce(n."totalN",0) "totalN",coalesce(n."totalP",0) "totalP",coalesce(n."totalK",0) "totalK",
    round(coalesce(n."totalN",0)+coalesce(n."totalP",0)+coalesce(n."totalK",0),2) "totalNPK",
    g."avgHeight",g."avgTillers"
  from growth g left join nutrients n using(location_id,treatment_id)
  left join public.dashboard_location_master l using(location_id)
  order by g."avgHeight" desc limit 15
),
options as (
  select array_agg(treatment_id order by treatment_id) treatments from (
    select distinct treatment_id from location_b where treatment_id is not null
    union select distinct treatment_id from location_f where treatment_id is not null
  ) x
),
days as (
  select
    (select array_agg(distinct observation_day order by observation_day) from location_b
      where (p_treatment_id='All' or treatment_id=p_treatment_id) and observation_day is not null) bio,
    (select array_agg(distinct day_after_planting order by day_after_planting) from location_f
      where (p_treatment_id='All' or treatment_id=p_treatment_id) and day_after_planting is not null) fert
)
select jsonb_build_object(
  'treatmentOptions',coalesce(to_jsonb(options.treatments),'[]'::jsonb),
  'biometricDayOptions',coalesce(to_jsonb(days.bio),'[]'::jsonb),
  'fertigationDayOptions',coalesce(to_jsonb(days.fert),'[]'::jsonb),
  'locationComparison',(select coalesce(jsonb_agg(to_jsonb(x) order by location_id),'[]') from location_rows x),
  'treatmentComparison',(select coalesce(jsonb_agg(to_jsonb(x) order by "performanceScore" desc),'[]') from treatment_rows x),
  'dayWiseBiometric',(select coalesce(jsonb_agg(to_jsonb(x) order by "day"),'[]') from bio_days x),
  'dayWiseFertigation',(select coalesce(jsonb_agg(to_jsonb(x) order by "day"),'[]') from fert_days x),
  'nutrientVsGrowth',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from nutrient_growth x),
  'summary',jsonb_build_object(
    'biometricRecords',(select count(*) from b),'fertigationRecords',(select count(*) from f),
    'latestDay',coalesce((select max(observation_day) from b),0),
    'totalNPK',round(coalesce((select sum(coalesce(n_kg,0)+coalesce(p2o5_kg,0)+coalesce(k2o_kg,0)) from f),0),2),
    'treatmentCount',(select count(*) from treatment_rows),
    'bestLocation',coalesce((select location from location_rows order by "avgHeight" desc limit 1),'-'),
    'bestTreatment',coalesce((select treatment from treatment_rows order by "performanceScore" desc limit 1),'-')
  )
)
from options cross join days;
$$;

revoke all on function public.get_comparative_analysis_results(text,text,numeric,numeric,numeric,numeric) from public;
grant execute on function public.get_comparative_analysis_results(text,text,numeric,numeric,numeric,numeric) to authenticated;
