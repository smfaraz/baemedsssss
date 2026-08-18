create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

drop policy if exists "Authenticated staff can read enquiries" on public.enquiries;
drop policy if exists "Authenticated staff can update enquiry status" on public.enquiries;

create policy "Only listed admins can read enquiries"
  on public.enquiries for select to authenticated
  using (public.is_admin());

create policy "Only listed admins can update enquiry status"
  on public.enquiries for update to authenticated
  using (public.is_admin())
  with check (public.is_admin() and status in ('new', 'contacted', 'closed'));

create policy "Admins can read their own admin record"
  on public.admin_users for select to authenticated
  using (user_id = auth.uid());
