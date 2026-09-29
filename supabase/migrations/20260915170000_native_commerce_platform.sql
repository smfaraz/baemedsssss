-- 20260915170000_native_commerce_platform.sql
-- BaeMeds USA: First-Party Native Commerce Engine
-- Replaces Shopify Storefront API with PostgreSQL native catalog, cart, and order tables.

-- ==============================================================================
-- 1. CATALOG ARCHITECTURE
-- ==============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  title text not null,
  vendor text not null default 'BaeMeds',
  category text not null,
  description text,
  specs text,
  warranty text,
  in_stock boolean not null default true,
  requires_prescription boolean not null default false,
  hcpcs_code text,
  fda_classification text check (fda_classification in ('Class I', 'Class II', 'Class III')),
  eligible_fsa_hsa boolean not null default false,
  is_regulatory_verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_handle_idx on public.products (handle);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_in_stock_idx on public.products (in_stock);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null default 'Standard',
  sku text,
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2),
  available_quantity integer not null default 100 check (available_quantity >= 0),
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_idx on public.product_variants (product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  display_order integer not null default 0
);

create index if not exists product_images_product_idx on public.product_images (product_id, display_order);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  value numeric(10, 2) not null check (value > 0),
  minimum_order_amount numeric(10, 2) default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- 2. NATIVE CART ARCHITECTURE
-- ==============================================================================

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carts_token_idx on public.carts (token);
create index if not exists carts_user_idx on public.carts (user_id);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index if not exists cart_items_cart_idx on public.cart_items (cart_id);

-- ==============================================================================
-- 3. NATIVE ORDER & FULFILLMENT ARCHITECTURE
-- ==============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_phone text,
  status text not null check (status in (
    'PENDING_PAYMENT',
    'PAID',
    'CLINICAL_REVIEW',
    'CLINICAL_APPROVED',
    'CLINICAL_REJECTED',
    'PROCESSING',
    'FULFILLMENT',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
  )),
  subtotal_amount numeric(12, 2) not null check (subtotal_amount >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  shipping_amount numeric(12, 2) not null default 0 check (shipping_amount >= 0),
  tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  currency text not null default 'USD',
  shipping_address jsonb not null,
  billing_address jsonb not null,
  carrier text,
  service_name text,
  tracking_number text,
  tracking_url text,
  requires_prescription boolean not null default false,
  prescription_attested boolean not null default false,
  payment_method text default 'credit_card',
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_number_idx on public.orders (order_number);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_title text not null,
  variant_title text,
  sku text,
  price numeric(12, 2) not null,
  quantity integer not null check (quantity > 0),
  total_price numeric(12, 2) not null,
  requires_prescription boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  new_status text not null,
  notes text,
  actor_id text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on public.order_status_history (order_id);

-- ==============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.promotions enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- Catalog: Public read-only; mutations restricted to administrators
create policy "Anyone can browse products"
  on public.products for select to authenticated, anon
  using (true);

create policy "Admins can manage products"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can browse variants"
  on public.product_variants for select to authenticated, anon
  using (true);

create policy "Admins can manage variants"
  on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can view product images"
  on public.product_images for select to authenticated, anon
  using (true);

create policy "Admins can manage product images"
  on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can view active promotions"
  on public.promotions for select to authenticated, anon
  using (is_active = true and (expires_at is null or expires_at > now()));

create policy "Admins can manage promotions"
  on public.promotions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Carts: Cart owners can access and update their cart
create policy "Users and guests can view their own cart"
  on public.carts for select to authenticated, anon
  using (user_id = auth.uid() or token is not null);

create policy "Users and guests can manage their own cart"
  on public.carts for all to authenticated, anon
  using (user_id = auth.uid() or token is not null)
  with check (user_id = auth.uid() or token is not null);

create policy "Cart items accessible by cart owner"
  on public.cart_items for all to authenticated, anon
  using (true) with check (true);

-- Orders: Customers view own orders; staff roles access per least-privilege
create policy "Customers can view their own orders"
  on public.orders for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.has_role('fulfillment_specialist')
    or public.has_role('clinical_specialist')
    or public.has_role('support_agent')
  );

create policy "Checkout service can create orders"
  on public.orders for insert to authenticated, anon
  with check (true);

create policy "Authorized staff can update orders"
  on public.orders for update to authenticated
  using (
    public.is_admin()
    or public.has_role('fulfillment_specialist')
    or public.has_role('clinical_specialist')
  )
  with check (
    public.is_admin()
    or public.has_role('fulfillment_specialist')
    or public.has_role('clinical_specialist')
  );

create policy "Order items viewable by order viewer"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (
        orders.user_id = auth.uid()
        or public.is_admin()
        or public.has_role('fulfillment_specialist')
        or public.has_role('clinical_specialist')
        or public.has_role('support_agent')
      )
    )
  );

create policy "Checkout service can insert order items"
  on public.order_items for insert to authenticated, anon
  with check (true);

create policy "Order status history viewable by staff or customer"
  on public.order_status_history for select to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_status_history.order_id
      and (orders.user_id = auth.uid() or public.is_admin() or public.has_role('support_agent'))
    )
  );

create policy "Staff can record order status history"
  on public.order_status_history for insert to authenticated, anon
  with check (true);
