# BaeMeds.com — Phase 4: Payment Integrity Report

**Focus**: Payment Lifecycle, Stripe Intent Tampering, Underpayment Defenses, Webhook Security, and Refund Controls  
**Date**: October 15, 2026  
**Auditor**: Principal Payments Engineer & Application Security Architect

---

## 1. Threat Model & Adversarial Payment Scenarios

In e-commerce systems handling durable medical equipment (DME), payment tampering presents severe financial and compliance risks. We audited the three primary payment attack surfaces:
1. **Client Amount Substitution in PaymentIntent Creation**
2. **Order Confirmation Underpayment & PaymentIntent Replay**
3. **Webhook Manipulation & Fail-Open Vulnerabilities**

---

## 2. In-Depth Technical Analysis & Remediations

### A. PaymentIntent Creation (`api/payment-intent.ts`)
- **Vulnerability Found**: The endpoint previously parsed `amount` and `amountInCents` directly from the client request body. If a user manipulated the client-side JavaScript or crafted an HTTP request with `{"amount": 1.00}`, the server requested a $1.00 Stripe PaymentIntent.
- **Remediation Implemented**:
  1. If `items` are passed, the server queries the `products` table in Supabase by product ID to obtain the authoritative unit price.
  2. The server sums `quantity * price`, applies shipping and discount caps, and computes the authoritative subtotal.
  3. If client tampering is detected or client supplies a lower total, the server forcibly overrides `amountInCents` with the authoritative amount.
  4. The calculated amount is validated against the $0.50 Stripe minimum charge threshold.
  5. The authoritative amount is stamped onto the Stripe PaymentIntent's `metadata.authoritative_cents` for cross-verification.

### B. Checkout Order Persistence (`api/checkout.ts`)
- **Vulnerability Found**: When an order was submitted to `/api/checkout`, the handler accepted the client's assertion that payment had completed, marking the order as `PAID` without verifying the PaymentIntent status or amount with the Stripe API.
- **Remediation Implemented**:
  1. Prior to persisting `status: 'PAID'`, `/api/checkout.ts` initiates a server-to-server call to Stripe: `stripe.paymentIntents.retrieve(paymentIntentId)`.
  2. The intent's status is validated: must be in `succeeded`, `processing`, or `requires_capture`.
  3. The currency is validated: must be `usd`.
  4. The amount is validated: `intent.amount >= Math.round(totalAmount * 100)`. If underpaid, order creation is rejected with HTTP 400.
  5. Replay Attack Defense: A database query checks if `payment_intent_id` has already been bound to an existing order. If already used, the transaction is rejected with HTTP 409 Conflict.

### C. Stripe Webhook Verification (`api/webhooks/stripe.ts`)
- **Vulnerability Found**: If `STRIPE_WEBHOOK_SECRET` was absent in the server environment, the webhook returned HTTP 200 with `{ received: true }`. This "fail-open" pattern caused Stripe to record the webhook as successfully processed, permanently dropping payment confirmation events.
- **Remediation Implemented**:
  1. **Strict Fail-Closed**: If `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` is missing, the endpoint immediately returns HTTP 503 Service Unavailable with an alert, instructing Stripe to retain the event in its retry queue.
  2. **Raw Cryptographic Signature Verification**: Reconstructs the event via `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)`. Missing or tampered signatures return HTTP 400.
  3. **Authoritative Amount Check**: In `payment_intent.succeeded`, the order's expected total amount is retrieved from Supabase. If `paymentIntent.amount < expectedCents`, the order is marked `PAYMENT_MISMATCH` with an audit alert, and is **never** transitioned to `PAID`.
  4. **Anti-Regression Safeguard**: Orders in `CANCELLED` or `REFUNDED` status cannot be overwritten by out-of-order `payment_intent.succeeded` events.
  5. **Refund Event Ingestion**: Added event handlers for `charge.refunded` and `payment_intent.canceled` to update order state to `REFUNDED` or `PARTIALLY_REFUNDED`.

---

## 3. Refund & Order-State Integrity (`api/admin.ts`)

- **Role Gating**: Only administrators with the `orders:refund` permission (`super_admin`) can trigger refunds. Support agents and clinical specialists are strictly denied with HTTP 403 Forbidden.
- **Balance Ceiling Validation**:
  - The requested refund amount cannot exceed `order.total_amount - (order.refunded_amount || 0)`.
  - Negative and zero refund amounts are rejected with HTTP 400.
- **Stripe Integration**:
  - Executes `stripe.refunds.create({ payment_intent: order.payment_intent_id, amount: Math.round(amount * 100) })`.
  - Stamps audit log entries with the Stripe Refund ID, actor ID, and remaining eligible balance.
- **Inventory Safety**: Issuing a financial refund does not automatically restock physical inventory, preventing ghost stock until items are physically received and inspected.

---

## 4. Test Verification Summary

All 13 adversarial payment and security test cases in `tests/adversarial-security.test.ts` passed:
1. `Server overrides tampered client amount ($1.00) with authoritative total`: **PASS**
2. `Sub-50¢ amount rejected with HTTP 400 and descriptive error`: **PASS**
3. `Unverified / tampered PaymentIntent cannot mark order PAID`: **PASS**
4. `Missing webhook secret returns HTTP 503 Fail-Closed (forces Stripe retry)`: **PASS**
5. `Missing stripe-signature header rejected with HTTP 400`: **PASS**
6. `Forged stripe-signature header rejected with HTTP 400`: **PASS**
7. `AdminService.issueOrderRefund throws 403 Forbidden for non-authorized roles`: **PASS**
