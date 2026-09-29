-- 20260915160000_adversarial_hardening.sql
-- BaeMeds USA: Phase 3 Adversarial Security Hardening
-- Prevents audit log actor forgery, ensures immutable logs, and prevents prescription approval spoofing

-- 1. HARDEN AUDIT LOG INSERT POLICY AGAINST ACTOR SPOOFING
drop policy if exists "Allow insert of audit events" on public.audit_logs;
drop policy if exists "Allow insert of audit events with verifiable actor" on public.audit_logs;

create policy "Allow insert of audit events with verifiable actor"
  on public.audit_logs for insert to authenticated, anon
  with check (
    -- Authenticated actors must match auth.uid() and their real role
    (
      auth.uid() is not null
      and actor_id = auth.uid()::text
      and (actor_role = public.get_my_role() or actor_role in ('customer', 'anonymous'))
    )
    or
    -- Unauthenticated actors can only be 'anonymous' or 'guest'
    (
      auth.uid() is null
      and actor_id in ('anonymous', 'guest')
      and actor_role = 'anonymous'
    )
  );

-- Verify immutable audit log: explicitly revoke update and delete for all roles
revoke update, delete, truncate on public.audit_logs from public, anon, authenticated;

-- 2. HARDEN PRESCRIPTIONS AGAINST CLIENT-SIDE STATUS ELEVATION
drop policy if exists "Customers can upload own prescriptions" on public.prescriptions;

create policy "Customers can upload own prescriptions with safe status"
  on public.prescriptions for insert to authenticated
  with check (
    user_id = auth.uid()
    and status in ('UPLOADED', 'UNDER_REVIEW')
  );

-- Ensure customers cannot update prescription review status
drop policy if exists "Only clinical specialists can review prescriptions" on public.prescriptions;

create policy "Only clinical specialists can review prescriptions"
  on public.prescriptions for update to authenticated
  using (public.is_admin() or public.has_role('clinical_specialist'))
  with check (public.is_admin() or public.has_role('clinical_specialist'));

-- 3. ENSURE STRICT SEARCH_PATH ON ALL SECURITY DEFINER FUNCTIONS
alter function public.get_my_role() set search_path = public, auth, extensions;
alter function public.has_role(text) set search_path = public, auth, extensions;
alter function public.is_admin() set search_path = public, auth, extensions;
