# BaeMeds.com — Phase 6 Replay Prevention & Idempotency Report

**Date:** October 16, 2026  
**Auditor:** Independent Principal Application Security Auditor & Senior Payments Reliability Engineer  
**Scope:** Database uniqueness constraints, atomic consumption mechanisms, concurrency defense, and webhook idempotency.

---

## 1. Threat Model & Vulnerability Analysis

A critical payment integrity risk in high-throughput ecommerce is the **Double-Spend Replay Attack**:
1. **Sequential Replay:** An attacker takes a valid `payment_intent_id` from a previously completed order and submits it in a second checkout request.
2. **Concurrent Replay (Race Condition):** An attacker fires multiple simultaneous HTTP requests with the exact same `payment_intent_id`. In a purely application-level check (`SELECT ... WHERE payment_intent_id = ...`), both requests read `null` before either writes, creating two successful orders for a single card charge.

---

## 2. Implemented Defense Architecture

### A. Pre-Insert Read Check (Fast Bailout)
Prior to allocating order IDs or executing item processing, `api/checkout.ts` queries the database:
```typescript
const { data: existingOrder, error: dbCheckErr } = await adminSupabase
  .from('orders')
  .select('id, order_number')
  .eq('payment_intent_id', paymentIntentId)
  .maybeSingle();

if (dbCheckErr) {
  throw new ApiError(500, `Database error during payment replay verification: ${dbCheckErr.message}`);
}

if (existingOrder) {
  throw new ApiError(409, `PaymentIntent ${paymentIntentId} has already been consumed for order #${existingOrder.order_number}.`);
}
```
**Fail-Closed Invariant:** If `dbCheckErr` is non-null (e.g. database down, network glitch), it throws HTTP 500. It does NOT proceed.

### B. Database-Enforced Unique Constraint (Atomic Serialization)
Application-level checks cannot defeat sub-millisecond concurrent races. To achieve ACID serialization, the database schema enforces uniqueness at the PostgreSQL engine level:

```sql
-- Migration: 20261016000000_payment_intent_unique_constraint.sql
create unique index if not exists orders_payment_intent_id_unique_idx 
  on public.orders (payment_intent_id) 
  where payment_intent_id is not null;
```

### C. Handled Postgres Error 23505
When two concurrent requests pass the pre-check simultaneously, PostgreSQL locks the index and allows exactly one insert to commit. The second insert aborts with PostgreSQL error code `23505` (`unique_violation`).

In `api/checkout.ts`:
```typescript
if (orderInsertError) {
  if (
    orderInsertError.code === '23505' ||
    orderInsertError.message?.toLowerCase().includes('duplicate key') ||
    orderInsertError.message?.toLowerCase().includes('unique constraint')
  ) {
    throw new ApiError(409, `PaymentIntent ${paymentIntentId} has already been consumed (concurrent transaction detected).`);
  }
  throw new ApiError(500, `Database error during order persistence: ${orderInsertError.message}`);
}
```

---

## 3. Webhook Idempotency Verification

Stripe webhooks are subject to at-least-once delivery semantics: network retries or gateway timeouts can deliver identical events multiple times.

### Invariant Checks in `api/webhooks/stripe.ts`:
1. **Duplicate `payment_intent.succeeded`:**
   Updates `status: 'PAID'` and `payment_status: 'paid'` idempotently using the order number from event metadata. Does not duplicate line items or dispatch duplicate drop-ship purchase orders.
2. **Terminal Guard:**
   Orders already in `CANCELLED`, `REFUNDED`, or `PARTIALLY_REFUNDED` states ignore late `payment_intent.succeeded` events with a logged warning.
3. **Refund Idempotency:**
   Multiple deliveries of `charge.refunded` perform idempotent updates to `REFUNDED`. Orders already fully `REFUNDED` cannot be demoted to `PARTIALLY_REFUNDED`.

---

## 4. Concurrency Test Evidence

All mechanisms were independently verified in automated test suites:
- **Condition 18:** Sequential replay attempt -> Rejected with HTTP 409 Conflict.
- **Condition 19:** Concurrent race condition triggering code `23505` -> Safely caught and rejected with HTTP 409 Conflict.
- **Condition 20:** Database replay check failure -> Fails closed with HTTP 500 without order creation.
- **Condition 23:** Duplicate webhook delivery -> Idempotent HTTP 200 `{ received: true }` without duplicate side-effects.
- **Condition 26:** Refund event replay -> Idempotent handling without status regression.
