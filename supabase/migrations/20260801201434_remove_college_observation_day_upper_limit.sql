alter table public.field_entries
drop constraint if exists field_entries_observation_day_check;

alter table public.field_entries
add constraint field_entries_observation_day_check
check (observation_day >= 1);