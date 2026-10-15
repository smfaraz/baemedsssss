-- Migration: 20261016000000_payment_intent_unique_constraint.sql
-- BaeMeds Phase 6: Payment Intent Unique Constraint and Schema Hardening
-- Enforces database-level replay prevention and atomic consumption for PaymentIntents.

-- 1. Add payment_intent_id to public.orders if not present
alter table public.orders 
  add column if not exists payment_intent_id text;

-- 2. Add payment_status to public.orders if not present
alter table public.orders 
  add column if not exists payment_status text check (
    payment_status is null or payment_status in (
      'unpaid',
      'pending',
      'authorized',
      'paid',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded',
      'underpaid',
      'overpaid'
    )
  );

-- 3. Create unique index on payment_intent_id (excluding nulls) to prevent concurrent replay
create unique index if not exists orders_payment_intent_id_unique_idx 
  on public.orders (payment_intent_id) 
  where payment_intent_id is not null;

-- 4. Create index on payment_status for admin filtering
create index if not exists orders_payment_status_idx 
  on public.orders (payment_status);

comment on column public.orders.payment_intent_id is 'Authoritative Stripe PaymentIntent identifier (pi_...). Enforced unique.';
comment on column public.orders.payment_status is 'Authoritative Stripe payment lifecycle status.';
