-- Update the three EXISTING raw-observation tables from field/value rows to
-- five complete observation rows per main entry. Existing raw values are
-- pivoted into the new layout before the legacy columns are removed.

begin;

-- Preserve the current dashboard view definitions while count columns are
-- made decimal-safe and Plant Number is removed from the main tables.
do $$
declare
  bio_source text;
  fert_source text;
  bio_calculation text;
  fert_calculation text;
begin
  select pg_get_viewdef('public.dashboard_biometric_source'::regclass, true) into bio_source;
  select pg_get_viewdef('public.dashboard_fertigation_source'::regclass, true) into fert_source;
  select pg_get_viewdef('public.dashboard_biometric_calculation_source'::regclass, true) into bio_calculation;
  select pg_get_viewdef('public.dashboard_fertigation_calculation_source'::regclass, true) into fert_calculation;

  drop view public.dashboard_biometric_calculation_source;
  drop view public.dashboard_fertigation_calculation_source;
  drop view public.dashboard_biometric_source;
  drop view public.dashboard_fertigation_source;

  alter table public.field_entries
    drop column if exists plant_number,
    alter column tiller_count type numeric using tiller_count::numeric,
    alter column leaf_count type numeric using leaf_count::numeric,
    alter column plant_count_1m type numeric using plant_count_1m::numeric,
    alter column plant_count_5m type numeric using plant_count_5m::numeric,
    alter column plant_count_15m type numeric using plant_count_15m::numeric,
    alter column number_of_nodes type numeric using number_of_nodes::numeric;

  alter table public.athani_field_entries drop constraint if exists athani_plant_num_check;
  alter table public.athani_field_entries
    drop column if exists plant_num,
    alter column tiller_count type numeric using tiller_count::numeric,
    alter column leaf_count type numeric using leaf_count::numeric;

  alter table public.anthiyur_field_entries
    alter column tiller_count type numeric using tiller_count::numeric,
    alter column leaf_count type numeric using leaf_count::numeric,
    alter column number_of_nodes type numeric using number_of_nodes::numeric,
    alter column millable_cane_count_1m type numeric using millable_cane_count_1m::numeric,
    alter column plant_count_1m type numeric using plant_count_1m::numeric;

  execute 'create view public.dashboard_biometric_source with (security_invoker = true) as ' || bio_source;
  execute 'create view public.dashboard_fertigation_source with (security_invoker = true) as ' || fert_source;
  execute 'create view public.dashboard_biometric_calculation_source with (security_invoker = true) as ' || bio_calculation;
  execute 'create view public.dashboard_fertigation_calculation_source with (security_invoker = true) as ' || fert_calculation;
end
$$;

-- -------------------------------------------------------------------------
-- College: preserve old EAV rows, reshape, then replace the old columns.
-- -------------------------------------------------------------------------
create temporary table college_observation_stage on commit drop as
select
  entry_id,
  observation_index as observation_no,
  max(created_by::text)::uuid as created_by,
  min(created_at) as created_at,
  max(observation_value) filter (where field_name = 'plant_height') as plant_height,
  max(observation_value) filter (where field_name = 'tiller_count') as tiller_count,
  max(observation_value) filter (where field_name = 'leaf_count') as leaf_count,
  max(observation_value) filter (where field_name = 'leaf_length') as leaf_length,
  max(observation_value) filter (where field_name = 'leaf_width') as leaf_width,
  max(observation_value) filter (where field_name = 'number_of_nodes') as number_of_nodes,
  max(observation_value) filter (where field_name = 'node_length') as node_length,
  max(observation_value) filter (where field_name = 'plant_count_1m') as plant_count_1m,
  max(observation_value) filter (where field_name = 'plant_count_5m') as plant_count_5m,
  max(observation_value) filter (where field_name = 'plant_count_15m') as plant_count_15m,
  max(observation_value) filter (where field_name = 'germination_pct') as germination_pct,
  max(observation_value) filter (where field_name = 'n_kg') as n_kg,
  max(observation_value) filter (where field_name = 'p2o5_kg') as p2o5_kg,
  max(observation_value) filter (where field_name = 'k2o_kg') as k2o_kg,
  max(observation_value) filter (where field_name = 'mn_mixture') as mn_mixture,
  max(observation_value) filter (where field_name in ('urea', 'urea_kg')) as urea_kg,
  max(observation_value) filter (where field_name in ('map', 'map_kg')) as map_kg,
  max(observation_value) filter (where field_name in ('dap', 'dap_kg')) as dap_kg,
  max(observation_value) filter (where field_name = 'white_potash_kg') as white_potash_kg,
  max(observation_value) filter (where field_name in ('ssp', 'ssp_kg')) as ssp_kg,
  max(observation_value) filter (where field_name in ('mop', 'mop_kg')) as mop_kg
from public.college_field_observations
group by entry_id, observation_index;

delete from public.college_field_observations;
alter table public.college_field_observations
  drop constraint if exists college_field_observations_unique_slot,
  drop constraint if exists college_field_observations_category_check,
  drop constraint if exists college_field_observations_index_check,
  drop constraint if exists college_field_observations_value_check,
  drop column if exists category,
  drop column if exists field_name,
  drop column if exists observation_index,
  drop column if exists observation_value,
  drop column if exists main_average,
  add column if not exists observation_day integer,
  add column if not exists observation_no integer,
  add column if not exists fertigation_date date,
  add column if not exists plant_height numeric,
  add column if not exists tiller_count numeric,
  add column if not exists leaf_count numeric,
  add column if not exists leaf_length numeric,
  add column if not exists leaf_width numeric,
  add column if not exists number_of_nodes numeric,
  add column if not exists node_length numeric,
  add column if not exists plant_count_1m numeric,
  add column if not exists plant_count_5m numeric,
  add column if not exists plant_count_15m numeric,
  add column if not exists germination_pct numeric,
  add column if not exists n_kg numeric,
  add column if not exists p2o5_kg numeric,
  add column if not exists k2o_kg numeric,
  add column if not exists mn_mixture numeric,
  add column if not exists urea_kg numeric,
  add column if not exists map_kg numeric,
  add column if not exists dap_kg numeric,
  add column if not exists white_potash_kg numeric,
  add column if not exists ssp_kg numeric,
  add column if not exists mop_kg numeric;

insert into public.college_field_observations (
  entry_id, observation_day, observation_no, fertigation_date, plant_height,
  tiller_count, leaf_count, leaf_length, leaf_width, number_of_nodes, node_length,
  plant_count_1m, plant_count_5m, plant_count_15m, germination_pct, n_kg,
  p2o5_kg, k2o_kg, mn_mixture, urea_kg, map_kg, dap_kg, white_potash_kg,
  ssp_kg, mop_kg, created_by, created_at
)
select s.entry_id, e.observation_day, s.observation_no, e.fertigation_date,
  s.plant_height, s.tiller_count, s.leaf_count, s.leaf_length, s.leaf_width,
  s.number_of_nodes, s.node_length, s.plant_count_1m, s.plant_count_5m,
  s.plant_count_15m, s.germination_pct, s.n_kg, s.p2o5_kg, s.k2o_kg,
  s.mn_mixture, s.urea_kg, s.map_kg, s.dap_kg, s.white_potash_kg,
  s.ssp_kg, s.mop_kg, s.created_by, s.created_at
from college_observation_stage s
join public.field_entries e on e.id = s.entry_id;

alter table public.college_field_observations
  alter column observation_day set not null,
  alter column observation_no set not null,
  add constraint college_field_observations_no_check check (observation_no between 1 and 5),
  add constraint college_field_observations_entry_no_key unique (entry_id, observation_no);

-- -------------------------------------------------------------------------
-- Athani.
-- -------------------------------------------------------------------------
create temporary table athani_observation_stage on commit drop as
select entry_id, observation_index as observation_no,
  max(created_by::text)::uuid as created_by, min(created_at) as created_at,
  max(observation_value) filter (where field_name = 'plant_height') as plant_height,
  max(observation_value) filter (where field_name = 'tiller_count') as tiller_count,
  max(observation_value) filter (where field_name = 'leaf_count') as leaf_count,
  max(observation_value) filter (where field_name in ('leaf_height', 'leaf_length')) as leaf_height,
  max(observation_value) filter (where field_name in ('leaf_breath', 'leaf_width')) as leaf_breath,
  max(observation_value) filter (where field_name = 'n_kg') as n_kg,
  max(observation_value) filter (where field_name = 'p2o5_kg') as p2o5_kg,
  max(observation_value) filter (where field_name = 'k2o_kg') as k2o_kg,
  max(observation_value) filter (where field_name = 'mn_mixture') as mn_mixture,
  max(observation_value) filter (where field_name in ('urea', 'urea_kg')) as urea_kg,
  max(observation_value) filter (where field_name in ('map', 'map_kg')) as map_kg,
  max(observation_value) filter (where field_name in ('dap', 'dap_kg')) as dap_kg,
  max(observation_value) filter (where field_name = 'white_potash_kg') as white_potash_kg
from public.athani_field_observations group by entry_id, observation_index;

delete from public.athani_field_observations;
alter table public.athani_field_observations
  drop column if exists category, drop column if exists field_name,
  drop column if exists observation_index, drop column if exists observation_value,
  drop column if exists main_average,
  add column if not exists observation_day integer,
  add column if not exists observation_no integer,
  add column if not exists fertigation_date date,
  add column if not exists plant_height numeric,
  add column if not exists tiller_count numeric,
  add column if not exists leaf_count numeric,
  add column if not exists leaf_height numeric,
  add column if not exists leaf_breath numeric,
  add column if not exists n_kg numeric,
  add column if not exists p2o5_kg numeric,
  add column if not exists k2o_kg numeric,
  add column if not exists mn_mixture numeric,
  add column if not exists urea_kg numeric,
  add column if not exists map_kg numeric,
  add column if not exists dap_kg numeric,
  add column if not exists white_potash_kg numeric;

insert into public.athani_field_observations (
  entry_id, observation_day, observation_no, fertigation_date, plant_height,
  tiller_count, leaf_count, leaf_height, leaf_breath, n_kg, p2o5_kg, k2o_kg,
  mn_mixture, urea_kg, map_kg, dap_kg, white_potash_kg, created_by, created_at
)
select s.entry_id, e.observation_day, s.observation_no, e.fertigation_date,
  s.plant_height, s.tiller_count, s.leaf_count, s.leaf_height, s.leaf_breath,
  s.n_kg, s.p2o5_kg, s.k2o_kg, s.mn_mixture, s.urea_kg, s.map_kg,
  s.dap_kg, s.white_potash_kg, s.created_by, s.created_at
from athani_observation_stage s join public.athani_field_entries e on e.id = s.entry_id;

alter table public.athani_field_observations
  alter column observation_day set not null,
  alter column observation_no set not null,
  add constraint athani_field_observations_no_check check (observation_no between 1 and 5),
  add constraint athani_field_observations_entry_no_key unique (entry_id, observation_no);

-- -------------------------------------------------------------------------
-- Anthiyur.
-- -------------------------------------------------------------------------
create temporary table anthiyur_observation_stage on commit drop as
select entry_id, observation_index as observation_no,
  max(created_by::text)::uuid as created_by, min(created_at) as created_at,
  max(observation_value) filter (where field_name = 'plant_height') as plant_height,
  max(observation_value) filter (where field_name = 'tiller_count') as tiller_count,
  max(observation_value) filter (where field_name = 'leaf_count') as leaf_count,
  max(observation_value) filter (where field_name in ('leaf_height', 'leaf_length')) as leaf_height,
  max(observation_value) filter (where field_name in ('leaf_breath', 'leaf_width')) as leaf_breath,
  max(observation_value) filter (where field_name = 'number_of_nodes') as number_of_nodes,
  max(observation_value) filter (where field_name = 'node_length') as node_length,
  max(observation_value) filter (where field_name = 'millable_cane_count_1m') as millable_cane_count_1m,
  max(observation_value) filter (where field_name = 'plant_count_1m') as plant_count_1m,
  max(observation_value) filter (where field_name = 'n_kg') as n_kg,
  max(observation_value) filter (where field_name = 'p2o5_kg') as p2o5_kg,
  max(observation_value) filter (where field_name = 'k2o_kg') as k2o_kg,
  max(observation_value) filter (where field_name = 'mn_mixture') as mn_mixture,
  max(observation_value) filter (where field_name in ('urea', 'urea_kg')) as urea_kg,
  max(observation_value) filter (where field_name in ('map', 'map_kg')) as map_kg,
  max(observation_value) filter (where field_name in ('dap', 'dap_kg')) as dap_kg,
  max(observation_value) filter (where field_name = 'white_potash_kg') as white_potash_kg
from public.anthiyur_field_observations group by entry_id, observation_index;

delete from public.anthiyur_field_observations;
alter table public.anthiyur_field_observations
  drop column if exists category, drop column if exists field_name,
  drop column if exists observation_index, drop column if exists observation_value,
  drop column if exists main_average,
  add column if not exists observation_day integer,
  add column if not exists observation_no integer,
  add column if not exists fertigation_date date,
  add column if not exists plant_height numeric,
  add column if not exists tiller_count numeric,
  add column if not exists leaf_count numeric,
  add column if not exists leaf_height numeric,
  add column if not exists leaf_breath numeric,
  add column if not exists number_of_nodes numeric,
  add column if not exists node_length numeric,
  add column if not exists millable_cane_count_1m numeric,
  add column if not exists plant_count_1m numeric,
  add column if not exists n_kg numeric,
  add column if not exists p2o5_kg numeric,
  add column if not exists k2o_kg numeric,
  add column if not exists mn_mixture numeric,
  add column if not exists urea_kg numeric,
  add column if not exists map_kg numeric,
  add column if not exists dap_kg numeric,
  add column if not exists white_potash_kg numeric;

insert into public.anthiyur_field_observations (
  entry_id, observation_day, observation_no, fertigation_date, plant_height,
  tiller_count, leaf_count, leaf_height, leaf_breath, number_of_nodes, node_length,
  millable_cane_count_1m, plant_count_1m, n_kg, p2o5_kg, k2o_kg, mn_mixture,
  urea_kg, map_kg, dap_kg, white_potash_kg, created_by, created_at
)
select s.entry_id, e.observation_day, s.observation_no, e.fertigation_date,
  s.plant_height, s.tiller_count, s.leaf_count, s.leaf_height, s.leaf_breath,
  s.number_of_nodes, s.node_length, s.millable_cane_count_1m, s.plant_count_1m,
  s.n_kg, s.p2o5_kg, s.k2o_kg, s.mn_mixture, s.urea_kg, s.map_kg,
  s.dap_kg, s.white_potash_kg, s.created_by, s.created_at
from anthiyur_observation_stage s join public.anthiyur_field_entries e on e.id = s.entry_id;

alter table public.anthiyur_field_observations
  alter column observation_day set not null,
  alter column observation_no set not null,
  add constraint anthiyur_field_observations_no_check check (observation_no between 1 and 5),
  add constraint anthiyur_field_observations_entry_no_key unique (entry_id, observation_no);

-- -------------------------------------------------------------------------
-- Final approved layout: numeric set ID + location mapping + average row.
-- entry_id was needed only while converting the old records and is removed.
-- -------------------------------------------------------------------------
alter table public.college_field_observations
  add column if not exists observation_set_id bigint,
  add column if not exists location_id text,
  add column if not exists row_type text;

with sets as (
  select entry_id, dense_rank() over (order by entry_id)::bigint observation_set_id
  from public.college_field_observations group by entry_id
)
update public.college_field_observations raw
set observation_set_id = sets.observation_set_id,
    location_id = 'L001', row_type = 'Observation'
from sets where sets.entry_id = raw.entry_id;

insert into public.college_field_observations (
  entry_id, observation_set_id, location_id, row_type, observation_day,
  observation_no, fertigation_date, plant_height, tiller_count, leaf_count,
  leaf_length, leaf_width, number_of_nodes, node_length, plant_count_1m,
  plant_count_5m, plant_count_15m, germination_pct, n_kg, p2o5_kg, k2o_kg,
  mn_mixture, urea_kg, map_kg, dap_kg, white_potash_kg, ssp_kg, mop_kg, created_by
)
select min(entry_id::text)::uuid, observation_set_id, 'L001', 'Average', min(observation_day),
  null, min(fertigation_date), avg(plant_height), avg(tiller_count), avg(leaf_count),
  avg(leaf_length), avg(leaf_width), avg(number_of_nodes), avg(node_length),
  avg(plant_count_1m), avg(plant_count_5m), avg(plant_count_15m), avg(germination_pct),
  avg(n_kg), avg(p2o5_kg), avg(k2o_kg), avg(mn_mixture), avg(urea_kg), avg(map_kg),
  avg(dap_kg), avg(white_potash_kg), avg(ssp_kg), avg(mop_kg), min(created_by::text)::uuid
from public.college_field_observations group by observation_set_id;

alter table public.athani_field_observations
  add column if not exists observation_set_id bigint,
  add column if not exists location_id text,
  add column if not exists row_type text;

with sets as (
  select entry_id, dense_rank() over (order by entry_id)::bigint observation_set_id
  from public.athani_field_observations group by entry_id
)
update public.athani_field_observations raw
set observation_set_id = sets.observation_set_id,
    location_id = 'L002', row_type = 'Observation'
from sets where sets.entry_id = raw.entry_id;

insert into public.athani_field_observations (
  entry_id, observation_set_id, location_id, row_type, observation_day,
  observation_no, fertigation_date, plant_height, tiller_count, leaf_count,
  leaf_height, leaf_breath, n_kg, p2o5_kg, k2o_kg, mn_mixture, urea_kg,
  map_kg, dap_kg, white_potash_kg, created_by
)
select min(entry_id::text)::uuid, observation_set_id, 'L002', 'Average', min(observation_day),
  null, min(fertigation_date), avg(plant_height), avg(tiller_count), avg(leaf_count),
  avg(leaf_height), avg(leaf_breath), avg(n_kg), avg(p2o5_kg), avg(k2o_kg),
  avg(mn_mixture), avg(urea_kg), avg(map_kg), avg(dap_kg), avg(white_potash_kg),
  min(created_by::text)::uuid
from public.athani_field_observations group by observation_set_id;

alter table public.anthiyur_field_observations
  add column if not exists observation_set_id bigint,
  add column if not exists location_id text,
  add column if not exists row_type text;

with sets as (
  select entry_id, dense_rank() over (order by entry_id)::bigint observation_set_id
  from public.anthiyur_field_observations group by entry_id
)
update public.anthiyur_field_observations raw
set observation_set_id = sets.observation_set_id,
    location_id = 'L003', row_type = 'Observation'
from sets where sets.entry_id = raw.entry_id;

insert into public.anthiyur_field_observations (
  entry_id, observation_set_id, location_id, row_type, observation_day,
  observation_no, fertigation_date, plant_height, tiller_count, leaf_count,
  leaf_height, leaf_breath, number_of_nodes, node_length, millable_cane_count_1m,
  plant_count_1m, n_kg, p2o5_kg, k2o_kg, mn_mixture, urea_kg, map_kg, dap_kg,
  white_potash_kg, created_by
)
select min(entry_id::text)::uuid, observation_set_id, 'L003', 'Average', min(observation_day),
  null, min(fertigation_date), avg(plant_height), avg(tiller_count), avg(leaf_count),
  avg(leaf_height), avg(leaf_breath), avg(number_of_nodes), avg(node_length),
  avg(millable_cane_count_1m), avg(plant_count_1m), avg(n_kg), avg(p2o5_kg),
  avg(k2o_kg), avg(mn_mixture), avg(urea_kg), avg(map_kg), avg(dap_kg),
  avg(white_potash_kg), min(created_by::text)::uuid
from public.anthiyur_field_observations group by observation_set_id;

-- The old ownership policies referenced entry_id. Replace them with policies
-- based on created_by before removing the obsolete entry link.
drop policy if exists "Users can insert their College observations" on public.college_field_observations;
drop policy if exists "Users can read their College observations" on public.college_field_observations;
drop policy if exists "Users can insert their Athani observations" on public.athani_field_observations;
drop policy if exists "Users can read their Athani observations" on public.athani_field_observations;
drop policy if exists "Users can insert their Anthiyur observations" on public.anthiyur_field_observations;
drop policy if exists "Users can read their Anthiyur observations" on public.anthiyur_field_observations;

alter table public.college_field_observations drop column entry_id cascade;
alter table public.athani_field_observations drop column entry_id cascade;
alter table public.anthiyur_field_observations drop column entry_id cascade;

alter table public.college_field_observations
  alter column observation_set_id set not null,
  alter column location_id set not null,
  alter column row_type set not null,
  alter column observation_no drop not null,
  add constraint college_observation_location_check check (location_id = 'L001'),
  add constraint college_observation_row_check check (
    (row_type = 'Observation' and observation_no between 1 and 5)
    or (row_type = 'Average' and observation_no is null)
  );
alter table public.athani_field_observations
  alter column observation_set_id set not null,
  alter column location_id set not null,
  alter column row_type set not null,
  alter column observation_no drop not null,
  add constraint athani_observation_location_check check (location_id = 'L002'),
  add constraint athani_observation_row_check check (
    (row_type = 'Observation' and observation_no between 1 and 5)
    or (row_type = 'Average' and observation_no is null)
  );
alter table public.anthiyur_field_observations
  alter column observation_set_id set not null,
  alter column location_id set not null,
  alter column row_type set not null,
  alter column observation_no drop not null,
  add constraint anthiyur_observation_location_check check (location_id = 'L003'),
  add constraint anthiyur_observation_row_check check (
    (row_type = 'Observation' and observation_no between 1 and 5)
    or (row_type = 'Average' and observation_no is null)
  );

create unique index college_observation_set_row_key on public.college_field_observations
  (observation_set_id, row_type, coalesce(observation_no, 0));
create unique index athani_observation_set_row_key on public.athani_field_observations
  (observation_set_id, row_type, coalesce(observation_no, 0));
create unique index anthiyur_observation_set_row_key on public.anthiyur_field_observations
  (observation_set_id, row_type, coalesce(observation_no, 0));

create policy "Users can insert their College observations" on public.college_field_observations
for insert to authenticated with check (created_by = auth.uid() and location_id = 'L001');
create policy "Users can read their College observations" on public.college_field_observations
for select to authenticated using (created_by = auth.uid());
create policy "Users can insert their Athani observations" on public.athani_field_observations
for insert to authenticated with check (created_by = auth.uid() and location_id = 'L002');
create policy "Users can read their Athani observations" on public.athani_field_observations
for select to authenticated using (created_by = auth.uid());
create policy "Users can insert their Anthiyur observations" on public.anthiyur_field_observations
for insert to authenticated with check (created_by = auth.uid() and location_id = 'L003');
create policy "Users can read their Anthiyur observations" on public.anthiyur_field_observations
for select to authenticated using (created_by = auth.uid());

commit;
