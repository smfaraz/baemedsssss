-- Migration: 20261016000000_payment_intent_unique_constraint.sql
-- BaeMeds Phase 6/7: Payment Intent Unique Constraint and Schema Hardening
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

-- 3. Ensure metadata and compatible columns exist on orders and order_items
alter table public.orders 
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.order_items 
  add column if not exists unit_price numeric(12, 2);

alter table public.order_items 
  add column if not exists metadata jsonb default '{}'::jsonb;

-- 4. Pre-flight check: Verify if any existing non-null duplicate payment_intent_id records exist
-- Critical Release Gate: MUST STOP BEFORE CREATING INDEX if duplicate non-null PaymentIntent IDs exist.
do $$
declare
  v_dup_count integer;
  v_sample_dups text;
begin
  select count(*), string_agg(masked_id, ', ') into v_dup_count, v_sample_dups
  from (
    select 
      left(payment_intent_id, 7) || '...' || right(payment_intent_id, 4) as masked_id
    from public.orders
    where payment_intent_id is not null
    group by payment_intent_id
    having count(*) > 1
    limit 5
  ) dups;

  if v_dup_count > 0 then
    raise exception 'MIGRATION_HALTED_DUPLICATE_PAYMENT_INTENTS: Found % duplicate non-null payment_intent_id group(s) in public.orders (sample: [%]). Deduplication required before applying unique index.', v_dup_count, coalesce(v_sample_dups, 'none');
  end if;
end $$;

-- 5. Create unique partial index on payment_intent_id (excluding nulls) to prevent concurrent replay
create unique index if not exists orders_payment_intent_id_unique_idx 
  on public.orders (payment_intent_id) 
  where payment_intent_id is not null;

-- 6. Create index on payment_status for admin filtering and lifecycle queries
create index if not exists orders_payment_status_idx 
  on public.orders (payment_status);

comment on column public.orders.payment_intent_id is 'Authoritative Stripe PaymentIntent identifier (pi_...). Enforced unique.';
comment on column public.orders.payment_status is 'Authoritative Stripe payment lifecycle status.';

-- 7. Atomic Order and Line Items Persistence RPC (Single PostgreSQL Transaction Guarantee)
create or replace function public.create_order_atomic(
  p_order jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order_id text;
  v_item jsonb;
  v_items_count integer := 0;
begin
  if p_order is null or p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'INVALID_ORDER_PAYLOAD: order object and non-empty items array required';
  end if;

  v_order_id := p_order->>'id';
  if v_order_id is null or v_order_id = '' then
    v_order_id := 'ord_' || gen_random_uuid();
  end if;

  -- Insert parent order
  insert into public.orders (
    id,
    order_number,
    customer_email,
    status,
    payment_status,
    payment_intent_id,
    currency,
    subtotal_amount,
    tax_amount,
    shipping_amount,
    discount_amount,
    total_amount,
    requires_prescription,
    shipping_address,
    billing_address,
    shipping_method,
    metadata,
    created_at,
    updated_at
  ) values (
    v_order_id,
    p_order->>'order_number',
    p_order->>'customer_email',
    coalesce(p_order->>'status', 'PENDING'),
    coalesce(p_order->>'payment_status', 'unpaid'),
    p_order->>'payment_intent_id',
    coalesce(p_order->>'currency', 'USD'),
    coalesce((p_order->>'subtotal_amount')::numeric, 0),
    coalesce((p_order->>'tax_amount')::numeric, 0),
    coalesce((p_order->>'shipping_amount')::numeric, 0),
    coalesce((p_order->>'discount_amount')::numeric, 0),
    coalesce((p_order->>'total_amount')::numeric, 0),
    coalesce((p_order->>'requires_prescription')::boolean, false),
    coalesce(p_order->'shipping_address', '{}'::jsonb),
    coalesce(p_order->'billing_address', '{}'::jsonb),
    p_order->>'shipping_method',
    coalesce(p_order->'metadata', '{}'::jsonb),
    coalesce((p_order->>'created_at')::timestamptz, now()),
    now()
  );

  -- Insert line items within the identical database transaction
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items (
      order_id,
      product_id,
      product_title,
      variant_id,
      variant_title,
      sku,
      unit_price,
      quantity,
      total_price,
      metadata,
      created_at
    ) values (
      v_order_id,
      v_item->>'product_id',
      coalesce(v_item->>'product_title', 'Medical Supply Item'),
      v_item->>'variant_id',
      v_item->>'variant_title',
      v_item->>'sku',
      coalesce((v_item->>'unit_price')::numeric, (v_item->>'price')::numeric, 0),
      coalesce((v_item->>'quantity')::integer, 1),
      coalesce((v_item->>'total_price')::numeric, 0),
      coalesce(v_item->'metadata', '{}'::jsonb),
      now()
    );
    v_items_count := v_items_count + 1;
  end loop;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'items_count', v_items_count
  );
exception
  when unique_violation then
    raise exception 'ORDER_CREATION_FAILED_UNIQUE: %', sqlerrm;
  when others then
    raise exception 'ORDER_CREATION_FAILED: %', sqlerrm;
end;
$$;

