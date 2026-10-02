-- ====================================================================
-- DISCOUNTS & PROMOTIONAL CODES TABLE
-- ====================================================================

create table if not exists public.discounts (
  id text primary key,
  code text unique not null,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric(10,2) not null check (value > 0),
  min_order_amount numeric(10,2) default 0.00,
  usage_limit integer,
  times_used integer default 0,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.discounts enable row level security;

create policy "Active discounts viewable by anyone"
  on public.discounts for select to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Only staff can manage discounts"
  on public.discounts for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Pre-seed standard launch promotion codes
insert into public.discounts (id, code, type, value, min_order_amount, usage_limit, times_used, is_active, expires_at)
values
  ('disc_welcome10', 'WELCOME10', 'percentage', 10, 50.00, 500, 42, true, '2026-12-31 23:59:59+00'),
  ('disc_clinical25', 'CLINICAL25', 'fixed', 25, 200.00, 100, 18, true, '2026-11-30 23:59:59+00'),
  ('disc_heroes50', 'HEROES50', 'fixed', 50, 500.00, 50, 7, true, '2026-12-31 23:59:59+00')
on conflict (code) do nothing;
