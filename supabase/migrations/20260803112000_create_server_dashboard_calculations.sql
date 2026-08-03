create or replace view public.dashboard_biometric_source
with (security_invoker = true)
as
select
  'csv'::text as source_type, source_key, null::uuid as source_row_id,
  location_id, plot_id, treatment_id, observation_day, date_of_observation,
  plant_count_1m, plant_count_5m, plant_count_15m, number_of_node,
  node_length_cm, millable_cane_count, cane_girth_cm, number_of_tillers,
  number_of_leaves, plant_height_cm, leaf_length_cm, leaf_breadth_cm,
  germination_pct
from public.dashboard_biometric_baseline
union all
select
  'supabase', 'field_entries:' || entry.id, entry.id,
  'L001', plot.plot_id, entry.treatment, entry.observation_day, entry.observation_date,
  entry.plant_count_1m, entry.plant_count_5m, entry.plant_count_15m,
  entry.number_of_nodes, entry.node_length, null, null, entry.tiller_count,
  entry.leaf_count, entry.plant_height, entry.leaf_length, entry.leaf_width,
  entry.germination_pct
from public.field_entries entry
join public.dashboard_plot_master plot
  on plot.location_id = 'L001' and upper(trim(plot.plot_name)) = upper(trim(entry.plot))
where entry.status = 'Approved'
union all
select
  'supabase', 'athani_field_entries:' || entry.id, entry.id,
  'L002', plot.plot_id, entry.treatment, entry.observation_day, entry.date_of_obs,
  null, null, null, null, null, null, null, entry.tiller_count,
  entry.leaf_count, entry.plant_height, entry.leaf_height, entry.leaf_breath, null
from public.athani_field_entries entry
join public.dashboard_plot_master plot
  on plot.location_id = 'L002' and upper(trim(plot.plot_name)) = upper(trim(entry.plot))
where entry.status = 'Approved'
union all
select
  'supabase', 'anthiyur_field_entries:' || entry.id, entry.id,
  'L003', plot.plot_id, entry.treatment, entry.observation_day, entry.date_of_obs,
  entry.plant_count_1m, null, null, entry.number_of_nodes, entry.node_length,
  entry.millable_cane_count_1m, null, entry.tiller_count, entry.leaf_count,
  entry.plant_height, entry.leaf_height, entry.leaf_breath, null
from public.anthiyur_field_entries entry
join public.dashboard_plot_master plot
  on plot.location_id = 'L003' and upper(trim(plot.plot_name)) = upper(trim(entry.plot))
where entry.status = 'Approved';

create or replace view public.dashboard_fertigation_source
with (security_invoker = true)
as
select
  'csv'::text as source_type, source_key, null::uuid as source_row_id,
  location_id, plot_id, treatment_id, day_after_planting, date,
  n_kg, p2o5_kg, k2o_kg, mn_mixture_kg, urea_kg, map_kg, dap_kg,
  white_potash_kg
from public.dashboard_fertigation_baseline
union all
select
  'supabase', 'field_entries:' || entry.id, entry.id,
  'L001', plot.plot_id, entry.treatment, entry.observation_day, entry.fertigation_date,
  entry.n_kg, entry.p2o5_kg, entry.k2o_kg, entry.mn_mixture, entry.urea,
  entry.map, entry.dap, entry.white_potash_kg
from public.field_entries entry
join public.dashboard_plot_master plot
  on plot.location_id = 'L001' and upper(trim(plot.plot_name)) = upper(trim(entry.plot))
where entry.status = 'Approved'
union all
select
  'supabase', 'athani_field_entries:' || entry.id, entry.id,
  'L002', plot.plot_id, entry.treatment, entry.observation_day, entry.fertigation_date,
  entry.n_kg, entry.p2o5_kg, entry.k2o_kg, entry.mn_mixture, entry.urea_kg,
  entry.map_kg, entry.dap_kg, entry.white_potash_kg
from public.athani_field_entries entry
join public.dashboard_plot_master plot
  on plot.location_id = 'L002' and upper(trim(plot.plot_name)) = upper(trim(entry.plot))
where entry.status = 'Approved'
union all
select
  'supabase', 'anthiyur_field_entries:' || entry.id, entry.id,
  'L003', plot.plot_id, entry.treatment, entry.observation_day, entry.fertigation_date,
  entry.n_kg, entry.p2o5_kg, entry.k2o_kg, entry.mn_mixture, entry.urea_kg,
  entry.map_kg, entry.dap_kg, entry.white_potash_kg
from public.anthiyur_field_entries entry
join public.dashboard_plot_master plot
  on plot.location_id = 'L003' and upper(trim(plot.plot_name)) = upper(trim(entry.plot))
where entry.status = 'Approved';

create table if not exists public.dashboard_current_results (
  location_id text primary key check (location_id in ('L001', 'L002', 'L003')),
  location_name text not null,
  source_signature text not null,
  calculation_version text not null,
  approved_row_count integer not null default 0,
  results jsonb not null,
  refreshed_at timestamptz not null default now()
);

alter table public.dashboard_calculation_snapshots
  alter column calculated_by drop not null;

alter table public.dashboard_current_results enable row level security;
revoke all on public.dashboard_current_results from anon, authenticated;
grant select on public.dashboard_current_results to anon, authenticated;
create policy "Dashboard results are publicly readable"
on public.dashboard_current_results for select to anon, authenticated
using (true);

create or replace function public.calculate_dashboard_location(p_location_id text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
with
b as (
  select * from public.dashboard_biometric_source where location_id = p_location_id
),
f as (
  select * from public.dashboard_fertigation_source where location_id = p_location_id
),
treatment_base as (
  select treatment_id as treatment,
    count(*) as record_count,
    round(avg(plant_height_cm), 1) as avg_plant_height,
    round(avg(number_of_tillers), 1) as avg_tillers,
    round(avg(number_of_leaves), 1) as avg_leaves,
    round(avg(leaf_length_cm), 1) as avg_leaf_length,
    round(avg(leaf_breadth_cm), 1) as avg_leaf_breadth
  from b where treatment_id is not null group by treatment_id
),
treatment_max as (
  select max(avg_plant_height) h, max(avg_tillers) t, max(avg_leaves) l,
    max(avg_leaf_length) ll, max(avg_leaf_breadth) lb from treatment_base
),
treatment_ranked as (
  select tb.*,
    round((case when tm.h > 0 then tb.avg_plant_height / tm.h * 40 else 0 end
      + case when tm.t > 0 then tb.avg_tillers / tm.t * 25 else 0 end
      + case when tm.l > 0 then tb.avg_leaves / tm.l * 15 else 0 end
      + case when tm.ll > 0 then tb.avg_leaf_length / tm.ll * 10 else 0 end
      + case when tm.lb > 0 then tb.avg_leaf_breadth / tm.lb * 10 else 0 end), 1) as performance_score
  from treatment_base tb cross join treatment_max tm
),
growth_day as (
  select observation_day as day, count(*) record_count,
    round(avg(plant_height_cm), 1) avg_plant_height,
    round(avg(number_of_tillers), 1) avg_tillers,
    round(avg(number_of_leaves), 1) avg_leaves
  from b where observation_day is not null group by observation_day
),
fert_day as (
  select day_after_planting as day, count(*) record_count,
    round(avg(n_kg), 1) avg_n, round(avg(p2o5_kg), 1) avg_p2o5,
    round(avg(k2o_kg), 1) avg_k2o
  from f where day_after_planting is not null group by day_after_planting
),
base_stats as (
  select count(*) biometric_records, count(distinct treatment_id) treatments,
    round(avg(plant_height_cm), 1) avg_height,
    round(avg(number_of_tillers), 1) avg_tillers,
    max(observation_day) latest_day,
    avg(plant_height_cm) raw_avg_height, avg(number_of_tillers) raw_avg_tillers
  from b
),
alert_stats as (
  select
    (select count(*) from b, base_stats where plant_height_cm < raw_avg_height * .75) low_growth,
    (select count(*) from b, base_stats where number_of_tillers < raw_avg_tillers * .7) weak_tillering,
    (select count(*) from public.dashboard_plot_master p, base_stats
      where p.location_id = p_location_id and not exists (
        select 1 from b where b.plot_id = p.plot_id and b.observation_day = base_stats.latest_day
      )) missing_entries,
    (select count(*) from f where coalesce(n_kg, 0) = 0 and coalesce(k2o_kg, 0) = 0) fertigation_attention,
    (select count(*) from b, base_stats where plant_height_cm < raw_avg_height * .6) high_priority
),
fert_totals as (
  select count(*) records, count(distinct plot_id) plots, count(distinct treatment_id) treatments,
    round(coalesce(sum(n_kg),0),2) n, round(coalesce(sum(p2o5_kg),0),2) p,
    round(coalesce(sum(k2o_kg),0),2) k, round(coalesce(sum(urea_kg),0),2) urea,
    round(coalesce(sum(map_kg),0),2) map, round(coalesce(sum(dap_kg),0),2) dap,
    round(coalesce(sum(white_potash_kg),0),2) potash
  from f
),
quality as (
  select jsonb_build_object(
    'plant_height_cm', round(count(plant_height_cm)::numeric / nullif(count(*),0) * 100, 1),
    'number_of_tillers', round(count(number_of_tillers)::numeric / nullif(count(*),0) * 100, 1),
    'number_of_leaves', round(count(number_of_leaves)::numeric / nullif(count(*),0) * 100, 1),
    'leaf_length_cm', round(count(leaf_length_cm)::numeric / nullif(count(*),0) * 100, 1),
    'leaf_breadth_cm', round(count(leaf_breadth_cm)::numeric / nullif(count(*),0) * 100, 1)
  ) biometric from b
),
rank_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'treatment', treatment, 'recordCount', record_count,
    'avgPlantHeight', avg_plant_height, 'avgTillers', avg_tillers,
    'avgLeaves', avg_leaves, 'avgLeafLength', avg_leaf_length,
    'avgLeafBreadth', avg_leaf_breadth, 'performanceScore', performance_score
  ) order by performance_score desc), '[]'::jsonb) rows from treatment_ranked
),
growth_json as (
  select coalesce(jsonb_agg(to_jsonb(growth_day) order by day), '[]'::jsonb) rows from growth_day
),
fert_json as (
  select coalesce(jsonb_agg(to_jsonb(fert_day) order by day), '[]'::jsonb) rows from fert_day
)
select jsonb_build_object(
  'overview', jsonb_build_object(
    'totalLocations', 1,
    'totalPlots', (select count(*) from public.dashboard_plot_master where location_id = p_location_id),
    'totalTreatments', bs.treatments, 'biometricRecords', bs.biometric_records,
    'fertigationRecords', ft.records, 'avgPlantHeight', coalesce(bs.avg_height,0),
    'avgTillers', coalesce(bs.avg_tillers,0), 'latestObservationDay', coalesce(bs.latest_day,0),
    'openAlerts', a.low_growth + a.weak_tillering + a.missing_entries + a.fertigation_attention
  ),
  'biometricGrowth', jsonb_build_object(
    'plantHeight', jsonb_build_object('average', coalesce(bs.avg_height,0)),
    'tillers', jsonb_build_object('average', coalesce(bs.avg_tillers,0)),
    'growthByDay', gj.rows
  ),
  'fertigationTracking', jsonb_build_object(
    'totalRecords', ft.records, 'totalPlots', ft.plots, 'totalTreatments', ft.treatments,
    'totals', jsonb_build_object('nKg',ft.n,'p2o5Kg',ft.p,'k2oKg',ft.k,'ureaKg',ft.urea,'mapKg',ft.map,'dapKg',ft.dap,'whitePotashKg',ft.potash),
    'fertilizerByDay', fj.rows
  ),
  'treatmentComparison', jsonb_build_object(
    'ranking', rj.rows,
    'bestTreatment', rj.rows->0->>'treatment',
    'weakestTreatment', rj.rows->(jsonb_array_length(rj.rows)-1)->>'treatment'
  ),
  'comparativeAnalysis', jsonb_build_object('treatmentRanking',rj.rows,'growthByDay',gj.rows,'fertilizerByDay',fj.rows),
  'smartAlerts', jsonb_build_object(
    'total',a.low_growth+a.weak_tillering+a.missing_entries+a.fertigation_attention,
    'lowGrowth',a.low_growth,'weakTillering',a.weak_tillering,'missingEntries',a.missing_entries,
    'fertigationAttention',a.fertigation_attention,'highPriority',a.high_priority,'latestObservationDay',coalesce(bs.latest_day,0)
  ),
  'dataQuality', jsonb_build_object('biometricCompleteness',q.biometric),
  'reports', jsonb_build_object(
    'biometricRecords',bs.biometric_records,'fertigationRecords',ft.records,
    'avgHeight',coalesce(bs.avg_height,0),'avgTillers',coalesce(bs.avg_tillers,0),
    'latestDay',coalesce(bs.latest_day,0),'treatmentRanking',rj.rows
  ),
  'treatmentMaster', jsonb_build_object(
    'referenceRows',(select count(*) from public.dashboard_treatment_master where location_id=p_location_id),
    'mappedPlots',(select count(*) from public.dashboard_plot_master where location_id=p_location_id)
  )
)
from base_stats bs cross join alert_stats a cross join fert_totals ft cross join quality q
cross join rank_json rj cross join growth_json gj cross join fert_json fj;
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
  if p_location_id not in ('L001','L002','L003') then raise exception 'Invalid location'; end if;
  payload := public.calculate_dashboard_location(p_location_id);
  select coalesce(jsonb_agg(source_key order by source_key),'[]'::jsonb), count(distinct source_key)
  into approved_ids, approved_count
  from (
    select source_key from public.dashboard_biometric_source where location_id=p_location_id and source_type='supabase'
    union
    select source_key from public.dashboard_fertigation_source where location_id=p_location_id and source_type='supabase'
  ) approved;
  signature := md5(approved_ids::text || payload::text || ':server-1.0.0');
  select coalesce(location_short_name,location_name,p_location_id) into location_label
  from public.dashboard_location_master where location_id=p_location_id;

  insert into public.dashboard_current_results(location_id,location_name,source_signature,calculation_version,approved_row_count,results,refreshed_at)
  values(p_location_id,location_label,signature,'server-1.0.0',approved_count,payload,now())
  on conflict(location_id) do update set
    location_name=excluded.location_name, source_signature=excluded.source_signature,
    calculation_version=excluded.calculation_version, approved_row_count=excluded.approved_row_count,
    results=excluded.results, refreshed_at=excluded.refreshed_at;

  if approved_count > 0 then
    insert into public.dashboard_calculation_snapshots(
      location_id, location_name, source_signature, approved_row_count,
      approved_row_ids, calculation_version, results, calculated_by
    ) values(
      p_location_id, location_label, signature, approved_count,
      approved_ids, 'server-1.0.0', payload, auth.uid()
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
begin
  if tg_op = 'DELETE' then
    perform public.refresh_dashboard_current_results(old.location_code);
  elsif tg_op = 'INSERT' and new.status = 'Approved' then
    perform public.refresh_dashboard_current_results(new.location_code);
  elsif tg_op = 'UPDATE' and (new.status = 'Approved' or old.status = 'Approved') then
    perform public.refresh_dashboard_current_results(new.location_code);
  end if;
  return null;
end;
$$;

drop trigger if exists refresh_dashboard_after_college_change on public.field_entries;
create trigger refresh_dashboard_after_college_change after insert or update or delete on public.field_entries
for each row execute function public.refresh_dashboard_after_entry_change();
drop trigger if exists refresh_dashboard_after_athani_change on public.athani_field_entries;
create trigger refresh_dashboard_after_athani_change after insert or update or delete on public.athani_field_entries
for each row execute function public.refresh_dashboard_after_entry_change();
drop trigger if exists refresh_dashboard_after_anthiyur_change on public.anthiyur_field_entries;
create trigger refresh_dashboard_after_anthiyur_change after insert or update or delete on public.anthiyur_field_entries
for each row execute function public.refresh_dashboard_after_entry_change();

revoke all on function public.calculate_dashboard_location(text) from public;
revoke all on function public.refresh_dashboard_current_results(text) from public;
grant execute on function public.calculate_dashboard_location(text) to service_role;
grant execute on function public.refresh_dashboard_current_results(text) to service_role;

select public.refresh_dashboard_current_results('L001');
select public.refresh_dashboard_current_results('L002');
select public.refresh_dashboard_current_results('L003');
