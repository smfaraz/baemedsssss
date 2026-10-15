# BaeMeds.com — Phase 6 Audit Findings

**Date:** October 16, 2026  
**Auditor:** Independent Principal Application Security Auditor & Senior Payments Reliability Engineer  
**Scope:** Serverless Checkout Gateway (`api/checkout.ts`), Webhook Synchronization Gateway (`api/webhooks/stripe.ts`), Postgres Database Schema & Migrations, Transaction Ledger.  
**Baseline Git Commit:** `251f393`  

---

## 1. Executive Summary

During Phase 5 independent verification, an urgent payment-integrity concern was escalated:
> *"Previous execution logs showed checkout code that initialized payment status to `PAID` before Stripe verification and could skip verification when the PaymentIntent was missing, mock, or Stripe credentials were unavailable."*

An adversarial source code and database audit was conducted against the current working tree. **The critical fail-open vulnerability was CONFIRMED in the source code.** In addition, a database schema omission was discovered that caused all orders to fail persistence silently, leaving payment replay defenses entirely disarmed.

All confirmed issues have been cataloged with exact file and line references below.

---

## 2. Confirmed Vulnerability Catalog

### Finding P6-01: Fail-Open Payment Status Initialization
- **File:** [api/checkout.ts](file:///c:/Users/FARAAZ/Downloads/beameds-main/baemeds%20usa/beameds-main/api/checkout.ts#L933-L934)
- **Severity:** Critical (CVSS 9.8 / CWE-393)
- **Status:** **CONFIRMED & REMEDIATED**
- **Evidence:**
  ```typescript
  // Original Lines 933-934
  let determinedStatus = 'PAID';
  let determinedPaymentStatus = 'paid';
  ```
  The order status variables defaulted to successful payment before any call to Stripe or database validation took place.

---

### Finding P6-02: Payment Verification Bypass via Missing or Mock PaymentIntent
- **File:** [api/checkout.ts](file:///c:/Users/FARAAZ/Downloads/beameds-main/baemeds%20usa/beameds-main/api/checkout.ts#L936-L989)
- **Severity:** Critical (CVSS 10.0 / CWE-284)
- **Status:** **CONFIRMED & REMEDIATED**
- **Evidence:**
  ```typescript
  // Original Line 936
  if (paymentIntentId && !paymentIntentId.startsWith('pi_mock_') && stripeSecretKey && !stripeSecretKey.includes('placeholder')) {
    // Stripe retrieval and verification occurred ONLY inside this block
  }
  ```
  **Attack Vector:**
  1. If an attacker called `/api/checkout` with `paymentIntentId: undefined` or omitted the field entirely, `paymentIntentId` evaluated to falsy.
  2. If an attacker submitted `paymentIntentId: 'pi_mock_free_cpap'`, `!paymentIntentId.startsWith('pi_mock_')` evaluated to false.
  3. If `STRIPE_SECRET_KEY` was missing from the server environment, `stripeSecretKey` evaluated to falsy.
  
  In all three cases, the entire Stripe verification block was bypassed. Because `determinedStatus` had been initialized to `'PAID'` (Finding P6-01), the application proceeded to create a confirmed order, record it in memory, trigger fulfillment alerts, and return `{ success: true, status: 'PAID' }` without any payment whatever.

---

### Finding P6-03: Silent Swallowing of Replay Detection Database Errors
- **File:** [api/checkout.ts](file:///c:/Users/FARAAZ/Downloads/beameds-main/baemeds%20usa/beameds-main/api/checkout.ts#L982-L984)
- **Severity:** High (CVSS 7.5 / CWE-391)
- **Status:** **CONFIRMED & REMEDIATED**
- **Evidence:**
  ```typescript
  // Original Lines 972-984
  try {
    const { data: existingOrder } = await adminSupabase
      .from('orders')
      .select('id, order_number')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (existingOrder) {
      throw new ApiError(409, `PaymentIntent ${paymentIntentId} has already been consumed for order #${existingOrder.order_number}.`);
    }
  } catch (dbCheckErr) {
    if (dbCheckErr instanceof ApiError) throw dbCheckErr;
    // Non-ApiError (PostgreSQL error, network timeout, connection drop) swallowed!
  }
  ```
  When the database lookup failed (e.g., table connection timeout or schema mismatch), the error was caught and ignored, allowing duplicate PaymentIntent consumption to proceed.

---

### Finding P6-04: Missing `payment_intent_id` and Unique Constraint in Supabase Schema
- **File:** [supabase/migrations/20260915170000_native_commerce_platform.sql](file:///c:/Users/FARAAZ/Downloads/beameds-main/baemeds%20usa/beameds-main/supabase/migrations/20260915170000_native_commerce_platform.sql#L100-L137)
- **Severity:** High (CVSS 8.2 / CWE-662)
- **Status:** **CONFIRMED & REMEDIATED**
- **Evidence:**
  Direct live inspection of the PostgreSQL table `public.orders` via `adminSupabase.from('orders').select('*').limit(1)` returned:
  `code: '42703', message: 'column orders.payment_intent_id does not exist'`.
  Neither `payment_intent_id` nor `payment_status` had been added to the database migration files, and no database-level unique constraint or unique index existed on `payment_intent_id`. Replay prevention was solely dependent on application-level lookups.

---

### Finding P6-05: Silent Swallowing of Order Persistence Failures (Fabricated Success)
- **File:** [api/checkout.ts](file:///c:/Users/FARAAZ/Downloads/beameds-main/baemeds%20usa/beameds-main/api/checkout.ts#L1050-L1079)
- **Severity:** High (CVSS 8.6 / CWE-390)
- **Status:** **CONFIRMED & REMEDIATED**
- **Evidence:**
  ```typescript
  // Original Lines 1050-1079
  try {
    const { error: orderInsertError } = await adminSupabase.from('orders').insert({ ... });
    if (!orderInsertError) {
      await adminSupabase.from('order_items').insert(formattedItems);
    }
  } catch (dbErr) {
    // Resilient fallback: order is securely retained in server store
  }
  ```
  Because `orderInsertError` was caught and not re-thrown, when the insert failed with Postgres error `42703` (Finding P6-04), the function did not fail. Instead, it returned `{ success: true, orderId, orderNumber }` claiming the order was placed, even though the order existed only in Node process memory and would vanish upon serverless cold-start.

---

### Finding P6-06: Webhook State Machine Incomplete Anti-Regression Safeguards
- **File:** [api/webhooks/stripe.ts](file:///c:/Users/FARAAZ/Downloads/beameds-main/baemeds%20usa/beameds-main/api/webhooks/stripe.ts#L78-L81)
- **Severity:** Medium (CVSS 6.5 / CWE-362)
- **Status:** **CONFIRMED & REMEDIATED**
- **Evidence:**
  In `payment_intent.succeeded`, orders with status `CANCELLED` and `REFUNDED` were guarded against regression, but `PARTIALLY_REFUNDED` was omitted. A delayed success event could transition a `PARTIALLY_REFUNDED` order back to `PAID`. Furthermore, `charge.refunded` had no check to prevent a partial refund event from demoting an order that was already fully `REFUNDED`.

---

## 3. Summary of Findings

| ID | Finding | Severity | File | Confirmed | Remediated |
|---|---|---|---|---|---|
| **P6-01** | Fail-Open Initialization (`determinedStatus = 'PAID'`) | Critical | `api/checkout.ts` | **YES** | **YES** |
| **P6-02** | Verification Bypass (Missing / Mock / No Secret) | Critical | `api/checkout.ts` | **YES** | **YES** |
| **P6-03** | Swallowing Replay Database Errors | High | `api/checkout.ts` | **YES** | **YES** |
| **P6-04** | Missing Database Unique Index on `payment_intent_id` | High | `supabase/migrations/` | **YES** | **YES** |
| **P6-05** | Order Persistence Failure Swallowed (Fake Success) | High | `api/checkout.ts` | **YES** | **YES** |
| **P6-06** | Webhook Anti-Regression Incomplete | Medium | `api/webhooks/stripe.ts` | **YES** | **YES** |
