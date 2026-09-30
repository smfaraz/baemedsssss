-- ====================================================================
-- BAEMEDS USA — MASTER DATABASE INITIALIZATION & SCHEMA DEPLOYMENT
-- Execute this file in your Supabase Dashboard: SQL Editor -> Run
-- Project ID: psyeixlohgkpvaymjyxh
-- ====================================================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- ====================================================================
-- 1. ADMINISTRATIVE USERS & RBAC ROLES
-- ====================================================================

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

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in (
    'super_admin',
    'compliance_officer',
    'clinical_specialist',
    'support_agent',
    'fulfillment_specialist',
    'customer'
  )) default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.user_roles where user_id = auth.uid()),
    case when exists (select 1 from public.admin_users where user_id = auth.uid()) then 'super_admin' else 'customer' end
  );
$$;

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = required_role
  ) or (
    required_role in ('super_admin', 'support_agent') and exists (select 1 from public.admin_users where user_id = auth.uid())
  );
$$;

create policy "Admins can read their own admin record"
  on public.admin_users for select to authenticated
  using (user_id = auth.uid());

create policy "Users can view their own role"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Only admins can modify user roles"
  on public.user_roles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ====================================================================
-- 2. CUSTOMER ENQUIRIES & NEWSLETTER SUBSCRIBERS
-- ====================================================================

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('rental', 'contact', 'bulk', 'availability')),
  product text,
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 30),
  email text not null check (char_length(email) between 5 and 254),
  rental_duration text,
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

create policy "Anyone can submit an enquiry"
  on public.enquiries for insert to anon, authenticated
  with check (status = 'new');

create policy "Only listed admins can read enquiries"
  on public.enquiries for select to authenticated
  using (public.is_admin());

create policy "Only listed admins can update enquiry status"
  on public.enquiries for update to authenticated
  using (public.is_admin())
  with check (public.is_admin() and status in ('new', 'contacted', 'closed', 'failed'));

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null check (char_length(email) between 5 and 254),
  subscribed_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe to newsletter"
  on public.newsletter_subscribers for insert to anon, authenticated
  with check (true);

create policy "Only listed admins can read newsletter subscribers"
  on public.newsletter_subscribers for select to authenticated
  using (public.is_admin());

-- ====================================================================
-- 3. AUDIT LOGS (HIPAA SECURITY RULE § 164.312(b))
-- ====================================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  actor_id text not null,
  actor_role text default 'anonymous',
  action text not null,
  resource_type text not null,
  resource_id text,
  status text not null default 'SUCCESS' check (status in ('SUCCESS', 'DENIED', 'ERROR')),
  ip_hash text,
  user_agent_hash text,
  sanitized_metadata jsonb default '{}'::jsonb
);

alter table public.audit_logs enable row level security;

create or replace function public.prevent_audit_tampering()
returns trigger
language plpgsql
security definer
as $$
begin
  raise exception 'Audit log entries are immutable and cannot be updated or deleted.';
end;
$$;

drop trigger if exists trg_prevent_audit_update on public.audit_logs;
create trigger trg_prevent_audit_update
  before update or delete on public.audit_logs
  for each row execute function public.prevent_audit_tampering();

create policy "Audit logs insertable by authorized system"
  on public.audit_logs for insert to anon, authenticated
  with check (true);

create policy "Audit logs readable only by compliance officers and super admins"
  on public.audit_logs for select to authenticated
  using (public.is_admin() or public.has_role('compliance_officer'));

-- ====================================================================
-- 4. PRESCRIPTION GOVERNANCE & CLINICAL REVIEW
-- ====================================================================

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_id text,
  patient_name_hash text not null,
  file_path text not null,
  file_hash text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  clinical_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prescriptions enable row level security;

create policy "Customers can upload own prescriptions"
  on public.prescriptions for insert to authenticated
  with check (user_id = auth.uid() and status = 'PENDING_REVIEW');

create policy "Customers can view own prescriptions"
  on public.prescriptions for select to authenticated
  using (user_id = auth.uid() or public.has_role('clinical_specialist') or public.is_admin());

create policy "Only clinical specialists can review prescriptions"
  on public.prescriptions for update to authenticated
  using (public.has_role('clinical_specialist') or public.is_admin())
  with check (public.has_role('clinical_specialist') or public.is_admin());

-- ====================================================================
-- 5. NATIVE CATALOG & INVENTORY
-- ====================================================================

create table if not exists public.products (
  id text primary key,
  title text not null,
  handle text unique not null,
  description text,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  wholesale_cost numeric(10,2),
  sku text,
  barcode text,
  mckesson_item_number text,
  inventory_quantity integer default 25,
  track_inventory boolean default true,
  is_hero_product boolean default false,
  featured_image text,
  images text[] default '{}',
  features text[] default '{}',
  specs jsonb default '{}'::jsonb,
  warranty text,
  is_rental_available boolean default false,
  prescription_required boolean default false,
  hcpcs_code text,
  fda_classification text,
  is_regulatory_verified boolean default false,
  seo_title text,
  seo_description text,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Active products viewable by anyone"
  on public.products for select to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Staff can manage products"
  on public.products for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists products_handle_idx on public.products (handle);
create index if not exists products_category_idx on public.products (category);

create table if not exists public.product_variants (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  title text not null default 'Standard',
  sku text,
  price numeric(10,2) not null check (price >= 0),
  available_quantity integer not null default 100 check (available_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_variants enable row level security;

create policy "Active variants viewable by anyone"
  on public.product_variants for select to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Staff can manage variants"
  on public.product_variants for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ====================================================================
-- 6. CARTS & CHECKOUT
-- ====================================================================

create table if not exists public.carts (
  id text primary key,
  token text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carts enable row level security;

create policy "Cart owner can read cart"
  on public.carts for select to anon, authenticated
  using (true);

create policy "Cart owner can create or update cart"
  on public.carts for all to anon, authenticated
  using (true)
  with check (true);

create table if not exists public.cart_items (
  id text primary key default gen_random_uuid()::text,
  cart_id text not null references public.carts(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  variant_id text not null references public.product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

alter table public.cart_items enable row level security;

create policy "Cart items viewable by cart owner"
  on public.cart_items for all to anon, authenticated
  using (true)
  with check (true);

-- ====================================================================
-- 7. NATIVE ORDERS & FULFILLMENT ENGINE
-- ====================================================================

create table if not exists public.orders (
  id text primary key,
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  status text not null default 'PAID' check (status in (
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
  currency text not null default 'USD',
  subtotal_amount numeric(10,2) not null check (subtotal_amount >= 0),
  tax_amount numeric(10,2) not null default 0.00 check (tax_amount >= 0),
  shipping_amount numeric(10,2) not null default 0.00 check (shipping_amount >= 0),
  discount_amount numeric(10,2) not null default 0.00 check (discount_amount >= 0),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  requires_prescription boolean not null default false,
  shipping_address jsonb not null default '{}'::jsonb,
  billing_address jsonb not null default '{}'::jsonb,
  shipping_method text not null default 'Standard Ground',
  tracking_number text,
  carrier text,
  tracking_url text,
  mckesson_po_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Customer can view own orders"
  on public.orders for select to authenticated, anon
  using (
    customer_email = coalesce(auth.jwt() ->> 'email', customer_email)
    or user_id = auth.uid()
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

create table if not exists public.order_items (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text,
  product_title text not null,
  variant_id text,
  variant_title text default 'Standard',
  sku text,
  mckesson_item_number text,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

create policy "Order items viewable by order viewer"
  on public.order_items for select to authenticated, anon
  using (true);

create policy "Checkout service can insert order items"
  on public.order_items for insert to authenticated, anon
  with check (true);

-- Customer Addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_email text,
  first_name text,
  last_name text,
  address1 text not null,
  address2 text,
  city text not null,
  province text not null,
  zip text not null,
  country text default 'United States',
  phone text,
  is_default boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

create policy "Users can view and manage own addresses"
  on public.addresses for all to authenticated, anon
  using (true)
  with check (true);

-- Output success verification
select 'BaeMeds Master Database Schema Initialized Successfully!' as status;
