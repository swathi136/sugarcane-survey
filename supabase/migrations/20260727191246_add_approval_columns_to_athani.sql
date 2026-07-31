alter table public.athani_field_entries
  add column if not exists status text not null default 'Pending',
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz;

alter table public.athani_field_entries
  add constraint athani_field_entries_status_check
  check (status in ('Pending', 'Approved', 'Rejected'));

alter table public.athani_field_entries
  add constraint athani_field_entries_approved_by_fkey
  foreign key (approved_by)
  references auth.users(id)
  on delete set null;