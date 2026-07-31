create table if not exists public.athani_field_entries (
  id uuid primary key default gen_random_uuid(),

  location_code text not null default 'L002',
  location_name text not null default 'Athani',

  plot text not null,
  treatment text not null,
  treatment_name text,

  observation_day integer not null,
  date_of_obs date not null,

  plant_num integer not null,
  plant_height numeric,
  tiller_count integer,
  leaf_count integer,
  leaf_height numeric,
  leaf_breath numeric,

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

  created_by uuid references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint athani_location_check
    check (location_code = 'L002'),

  constraint athani_observation_day_check
    check (observation_day >= 1 and observation_day <= 240),

  constraint athani_plant_num_check
    check (plant_num > 0)
);

alter table public.athani_field_entries
enable row level security;

create policy "Authenticated users can insert Athani field entries"
on public.athani_field_entries
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Users can read their own Athani field entries"
on public.athani_field_entries
for select
to authenticated
using (created_by = auth.uid());

grant select, insert on table public.athani_field_entries to authenticated;
grant all on table public.athani_field_entries to service_role;