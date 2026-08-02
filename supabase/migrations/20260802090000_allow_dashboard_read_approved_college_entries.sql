create policy "Dashboard can read approved College entries"
on public.field_entries
for select
to anon, authenticated
using (status = 'Approved');
