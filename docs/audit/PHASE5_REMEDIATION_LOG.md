# BaeMeds.com — Phase 5: Remediation Log

**Roles**: Principal Application Security Auditor & Senior Payments QA Lead  
**Audit Target**: `api/checkout.ts`, `api/webhooks/stripe.ts`, `tests/adversarial-security.test.ts`  
**Date**: October 15, 2026  

---

## 1. Remediation Summary Index

| Remediation ID | Component | Defect Found | Severity | Resolution Applied | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P5-REM-01** | `api/checkout.ts` | Overpayment & Amount Inequality | **HIGH** | Changed comparison to exact equality (`intent.amount !== expectedCents`) rejecting overpayment and underpayment | `tests/adversarial-security.test.ts` |
| **P5-REM-02** | `api/checkout.ts` | False `PAID` State on Uncaptured Intents | **HIGH** | Mapped `requires_capture` -> `AUTHORIZED` and `processing` -> `PENDING`; order fulfillment remains locked | Code inspection & manual probe |
| **P5-REM-03** | `api/checkout.ts` | Missing `payment_intent_id` in Supabase Order Insert | **MEDIUM** | Added `payment_intent_id: paymentIntentId` and `status: determinedStatus` into Supabase insert payload | Code inspection & DB schema |
| **P5-REM-04** | `api/webhooks/stripe.ts` | Lack of Capturable Authorization Handling | **MEDIUM** | Added handler for `payment_intent.amount_capturable_updated` updating order to `AUTHORIZED` | Code inspection & webhook dispatcher |
| **P5-REM-05** | `tests/adversarial-security.test.ts` | Missing `isActive` in Test `AdminUser` Object | **LOW** | Added `isActive: true` to support actor fixture, resolving TypeScript compilation error | `npx tsc --noEmit` (0 errors) |

---

## 2. Detailed Technical Remediation Entries

### P5-REM-01: Strict Exact-Amount Payment Equality
- **Vulnerability**: `api/checkout.ts` previously checked `if (intent.amount < expectedCents)`. This prevented underpayment, but allowed an attacker to overpay by $1.00 or submit an arbitrary oversized payment intent.
- **Impact**: Payment amount mismatches break financial reconciliation, sales tax liability accounting, and merchant refund thresholds.
- **Fix Applied**: Updated check to strict exact equality:
  ```ts
  const expectedCents = Math.round(totalAmount * 100);
  if (intent.amount !== expectedCents) {
    const mismatchType = intent.amount < expectedCents ? 'underpaid' : 'overpaid';
    throw new ApiError(400, `Payment amount mismatch (${mismatchType}). Order total is $${totalAmount.toFixed(2)} (${expectedCents}¢), but PaymentIntent was authorized for $${(intent.amount / 100).toFixed(2)} (${intent.amount}¢).`);
  }
  ```
- **Regression Verification**: Verified in checkout handler logic and adversarial test assertions.

### P5-REM-02: Uncaptured PaymentIntent Status Mapping
- **Vulnerability**: If a client submitted a PaymentIntent with `status: 'requires_capture'` (manual authorization) or `status: 'processing'` (in-flight bank debit), `api/checkout.ts` previously accepted it and marked the order as `PAID`.
- **Impact**: Goods could be shipped to a patient before funds were captured or settled, resulting in inventory and financial loss.
- **Fix Applied**: Enforced status differentiation:
  ```ts
  if (intent.status === 'requires_capture') {
    determinedStatus = 'AUTHORIZED';
    determinedPaymentStatus = 'authorized';
  } else if (intent.status === 'processing') {
    determinedStatus = 'PENDING';
    determinedPaymentStatus = 'pending';
  } else {
    determinedStatus = 'PAID';
    determinedPaymentStatus = 'paid';
  }
  ```
- **Regression Verification**: Uncaptured authorizations are now persisted as `AUTHORIZED` (fulfillment locked) and only transition to `PAID` once the funds are captured via Stripe.

### P5-REM-03: `payment_intent_id` Database Insertion
- **Vulnerability**: While `firstPartyOrder` in-memory object stored `payment_intent_id`, the async `adminSupabase.from('orders').insert(...)` call omitted `payment_intent_id`, leaving the database column NULL until webhook execution.
- **Impact**: Database queries checking for replay attacks (`select eq('payment_intent_id')`) had a race condition prior to webhook delivery.
- **Fix Applied**: Explicitly included `payment_intent_id: paymentIntentId`, `payment_status: determinedPaymentStatus`, and `status: determinedStatus` in the Supabase insert payload.

### P5-REM-04: Webhook `amount_capturable_updated` Support
- **Vulnerability**: When a manual authorization occurred, Stripe emitted `payment_intent.amount_capturable_updated`, which was unhandled in `api/webhooks/stripe.ts`.
- **Fix Applied**: Added case for `payment_intent.amount_capturable_updated` to mark the order as `AUTHORIZED` with `payment_status: 'authorized'`, and updated `payment_intent.succeeded` to flag overpaid intents as `PAYMENT_MISMATCH`.

### P5-REM-05: TypeScript Test Fixture Type Invariant
- **Vulnerability**: `tests/adversarial-security.test.ts` passed an object without `isActive: true` to `AdminService.issueOrderRefund`, causing `npx tsc --noEmit` to fail with TS2345.
- **Fix Applied**: Added `isActive: true` to the fixture.
- **Verification**: `npx tsc --noEmit` exited cleanly with Code 0.
