alter table public.field_entries
add column if not exists custom_biometric jsonb not null default '[]'::jsonb,
add column if not exists custom_fertigation jsonb not null default '[]'::jsonb;

alter table public.field_entries
add constraint field_entries_custom_biometric_array_check
check (jsonb_typeof(custom_biometric) = 'array');

alter table public.field_entries
add constraint field_entries_custom_fertigation_array_check
check (jsonb_typeof(custom_fertigation) = 'array');