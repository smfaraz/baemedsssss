-- 20260915150000_security_hardening_and_rbac.sql
-- BaeMeds USA: Security Hardening, Granular RBAC, Immutable Audit Logs, and Prescription Document Governance

-- 1. FIX PERMISSIVE POLICIES ON ENQUIRIES
drop policy if exists "Authenticated staff can update enquiry status" on public.enquiries;
drop policy if exists "Only listed admins can update enquiry status" on public.enquiries;

create policy "Only listed admins can update enquiry status"
  on public.enquiries for update to authenticated
  using (public.is_admin())
  with check (public.is_admin() and status in ('new', 'contacted', 'closed', 'failed'));

-- 2. FIX PERMISSIVE POLICY ON NEWSLETTER SUBSCRIBERS
drop policy if exists "Subscribers can be read by authenticated staff" on public.newsletter_subscribers;
drop policy if exists "Only listed admins can read newsletter subscribers" on public.newsletter_subscribers;

create policy "Only listed admins can read newsletter subscribers"
  on public.newsletter_subscribers for select to authenticated
  using (public.is_admin());

-- 3. GRANULAR ROLE-BASED ACCESS CONTROL (RBAC)
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

create policy "Users can view their own role"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Only admins can modify user roles"
  on public.user_roles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. IMMUTABLE AUDIT LOG TABLE (HIPAA TECHNICAL SAFEGUARDS § 164.312(b))
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  actor_id text not null,
  actor_role text default 'anonymous',
  action text not null,
  resource text not null,
  result text not null check (result in ('SUCCESS', 'FAILURE', 'DENIED')),
  metadata jsonb default '{}'::jsonb,
  ip_hash text
);

alter table public.audit_logs enable row level security;

-- Append-only policy: authenticated clients and server functions can insert audit events
create policy "Allow insert of audit events"
  on public.audit_logs for insert to authenticated, anon
  with check (true);

-- Select restricted strictly to super_admin or compliance_officer
create policy "Only compliance officers and admins can inspect audit logs"
  on public.audit_logs for select to authenticated
  using (public.is_admin() or public.has_role('compliance_officer'));

-- Immutable: Disallow update and delete for all users
-- (No update or delete policies created = operations rejected by default under RLS)

create index if not exists audit_logs_timestamp_idx on public.audit_logs (timestamp desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);

-- 5. PRESCRIPTION & MEDICAL DOCUMENT GOVERNANCE
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_id text,
  file_path text not null,
  file_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes integer not null check (file_size_bytes <= 10485760), -- 10MB limit
  status text not null default 'UNDER_REVIEW' check (status in (
    'UPLOADED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'EXPIRED'
  )),
  clinical_reviewer_id uuid references auth.users(id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.prescriptions enable row level security;

-- Customers can view only their own uploaded prescriptions
create policy "Customers can view their own prescriptions"
  on public.prescriptions for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.has_role('clinical_specialist')
    or public.has_role('compliance_officer')
  );

-- Customers can upload prescriptions for their own account
create policy "Customers can upload own prescriptions"
  on public.prescriptions for insert to authenticated
  with check (
    user_id = auth.uid()
    and status in ('UPLOADED', 'UNDER_REVIEW')
  );

-- Only clinical specialists or admins can approve, reject, or update review status
create policy "Only clinical specialists can review prescriptions"
  on public.prescriptions for update to authenticated
  using (public.is_admin() or public.has_role('clinical_specialist'))
  with check (public.is_admin() or public.has_role('clinical_specialist'));

create index if not exists prescriptions_user_idx on public.prescriptions (user_id);
create index if not exists prescriptions_status_idx on public.prescriptions (status);
