create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('rental', 'contact', 'bulk', 'availability')),
  product text,
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 30),
  email text not null check (char_length(email) between 5 and 254),
  rental_duration text,
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

create policy "Anyone can submit an enquiry"
  on public.enquiries for insert to anon, authenticated
  with check (status = 'new');

create policy "Authenticated staff can read enquiries"
  on public.enquiries for select to authenticated
  using (true);

create policy "Authenticated staff can update enquiry status"
  on public.enquiries for update to authenticated
  using (true)
  with check (status in ('new', 'contacted', 'closed'));

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);
