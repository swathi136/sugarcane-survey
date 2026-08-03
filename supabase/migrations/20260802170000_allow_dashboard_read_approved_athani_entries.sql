create policy "Dashboard can read approved Athani entries"
on public.athani_field_entries
for select
to anon, authenticated
using (status = 'Approved');

grant select (
  id, location_code, location_name, plot, treatment, treatment_name,
  observation_day, date_of_obs, plant_num, plant_height, tiller_count,
  leaf_count, leaf_height, leaf_breath, fertigation_date, n_kg, p2o5_kg,
  k2o_kg, mn_mixture, urea_kg, map_kg, dap_kg, white_potash_kg,
  status, created_at
)
on public.athani_field_entries
to anon;
