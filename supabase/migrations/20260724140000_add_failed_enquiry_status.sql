alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check check (status in ('new', 'contacted', 'closed', 'failed'));

drop policy if exists "Authenticated staff can update enquiry status" on public.enquiries;
create policy "Authenticated staff can update enquiry status"
  on public.enquiries for update to authenticated
  using (true)
  with check (status in ('new', 'contacted', 'closed', 'failed'));
