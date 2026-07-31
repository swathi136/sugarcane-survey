create table if not exists public.anthiyur_field_entries (
  id uuid primary key default gen_random_uuid(),

  location_code text not null default 'L003',
  location_name text not null default 'Anthiyur',

  plot text not null,
  treatment text not null,
  treatment_name text,

  observation_day integer not null,
  date_of_obs date not null,

  plant_height numeric,
  tiller_count integer,
  leaf_count integer,
  leaf_height numeric,
  leaf_breath numeric,
  number_of_nodes integer,
  node_length numeric,
  millable_cane_count_1m integer,
  plant_count_1m integer,

  fertigation_date date not null,
  n_kg numeric,
  p2o5_kg numeric,
  k2o_kg numeric,
  mn_mixture numeric,
  urea_kg numeric,
  map_kg numeric,
  dap_kg numeric,
  white_potash_kg numeric,

  custom_biometric jsonb not null default '[]'::jsonb,
  custom_fertigation jsonb not null default '[]'::jsonb,

  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  status text not null default 'Pending',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,

  constraint anthiyur_location_code_check
    check (location_code = 'L003'),
  constraint anthiyur_location_name_check
    check (location_name = 'Anthiyur'),
  constraint anthiyur_plot_check
    check (plot in ('Plot A', 'Plot B', 'Plot C', 'Plot D', 'Plot E')),
  constraint anthiyur_treatment_check
    check (treatment in ('T1', 'T2', 'T3', 'T4', 'T5')),
  constraint anthiyur_observation_day_check
    check (observation_day >= 1 and observation_day <= 240),
  constraint anthiyur_status_check
    check (status in ('Pending', 'Approved', 'Rejected')),
  constraint anthiyur_measurements_nonnegative_check
    check (
      (plant_height is null or plant_height >= 0)
      and (tiller_count is null or tiller_count >= 0)
      and (leaf_count is null or leaf_count >= 0)
      and (leaf_height is null or leaf_height >= 0)
      and (leaf_breath is null or leaf_breath >= 0)
      and (number_of_nodes is null or number_of_nodes >= 0)
      and (node_length is null or node_length >= 0)
      and (millable_cane_count_1m is null or millable_cane_count_1m >= 0)
      and (plant_count_1m is null or plant_count_1m >= 0)
    ),
  constraint anthiyur_fertigation_nonnegative_check
    check (
      (n_kg is null or n_kg >= 0)
      and (p2o5_kg is null or p2o5_kg >= 0)
      and (k2o_kg is null or k2o_kg >= 0)
      and (mn_mixture is null or mn_mixture >= 0)
      and (urea_kg is null or urea_kg >= 0)
      and (map_kg is null or map_kg >= 0)
      and (dap_kg is null or dap_kg >= 0)
      and (white_potash_kg is null or white_potash_kg >= 0)
    ),
  constraint anthiyur_custom_biometric_array_check
    check (jsonb_typeof(custom_biometric) = 'array'),
  constraint anthiyur_custom_fertigation_array_check
    check (jsonb_typeof(custom_fertigation) = 'array')
);

alter table public.anthiyur_field_entries
enable row level security;

create policy "Authenticated users can insert Anthiyur field entries"
on public.anthiyur_field_entries
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Users can read their own Anthiyur field entries"
on public.anthiyur_field_entries
for select
to authenticated
using (created_by = auth.uid());

grant select, insert on table public.anthiyur_field_entries to authenticated;
grant all on table public.anthiyur_field_entries to service_role;
