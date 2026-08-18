create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 5 and 254),
  subscribed_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe to newsletter"
  on public.newsletter_subscribers for insert to anon, authenticated
  with check (email = lower(email));

create policy "Subscribers can be read by authenticated staff"
  on public.newsletter_subscribers for select to authenticated using (true);

create index if not exists newsletter_subscribers_subscribed_at_idx on public.newsletter_subscribers (subscribed_at desc);
