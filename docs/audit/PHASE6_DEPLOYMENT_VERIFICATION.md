# BaeMeds.com — Phase 6 Deployment Verification

**Date:** October 16, 2026  
**Auditor:** Independent Principal Release Engineer & DevSecOps Auditor  
**Production Host:** `https://www.baemeds.com`  
**Target Architecture:** Vercel Serverless Edge + Supabase Managed PostgreSQL + Stripe Payments API  

---

## 1. Verified Local Code State

- **Baseline Commit:** `251f393`
- **Target Branch:** `main`
- **TypeScript Static Analysis:** Clean (`npx tsc --noEmit` exited with 0 errors).
- **Dependency Audit:** Clean (`npm audit` reported 0 vulnerabilities).
- **Production Build:** Clean (`npm run build` generated 26 prerendered routes + 3,181 sitemap URLs).
- **Test Suite:** 156 / 156 tests passing (100% pass rate).

---

## 2. Production Deployment Status & Limitations

> [!WARNING]
> **Independent Verification Finding:**
> While local and isolated test environments verify all payment security controls, the **production deployment** on `https://www.baemeds.com` currently runs the pre-Phase 6 build (`251f393`).
> 
> Furthermore:
> 1. The database migration `supabase/migrations/20261016000000_payment_intent_unique_constraint.sql` has NOT yet been applied to the production Supabase database.
> 2. Querying the live database confirms that column `orders.payment_intent_id` does NOT exist in production yet.
> 3. Therefore, deploying the code to production BEFORE applying the migration will cause all checkouts to fail closed with HTTP 500 (`column orders.payment_intent_id does not exist`), preserving payment security but blocking customer transactions.

---

## 3. Deployment Checklist for Live Release

To advance from `GO FOR TEST-MODE VALIDATION` to `GO FOR LIVE-MODE PREPARATION`:

1. [ ] **Step 1 — Apply Database Migration:**
   Apply `supabase/migrations/20261016000000_payment_intent_unique_constraint.sql` to the production Supabase instance using Supabase CLI or SQL Editor:
   ```sql
   alter table public.orders add column if not exists payment_intent_id text;
   alter table public.orders add column if not exists payment_status text;
   create unique index if not exists orders_payment_intent_id_unique_idx on public.orders (payment_intent_id) where payment_intent_id is not null;
   create index if not exists orders_payment_status_idx on public.orders (payment_status);
   ```
2. [ ] **Step 2 — Push Phase 6 Git Commit:**
   Commit the remediated code and push to `origin/main` to trigger Vercel deployment.
3. [ ] **Step 3 — Configure Production Environment Secrets:**
   Ensure production Vercel environment variables contain:
   - `STRIPE_SECRET_KEY` (Live key `sk_live_...` or verified test key `sk_test_...`)
   - `STRIPE_WEBHOOK_SECRET` (`whsec_...`)
   - `SUPABASE_SERVICE_ROLE_KEY`
4. [ ] **Step 4 — Verify Webhook Endpoint in Stripe Dashboard:**
   Confirm endpoint `https://www.baemeds.com/api/webhooks/stripe` is configured for events:
   - `payment_intent.succeeded`
   - `payment_intent.amount_capturable_updated`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
