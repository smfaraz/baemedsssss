# BaeMeds.com — Phase 5: Payment State Machine & Lifecycle Verification Report

**Roles**: Stripe Payments Engineer & Principal Application Security Auditor  
**Audit Target**: `api/checkout.ts`, `api/payment-intent.ts`, `api/webhooks/stripe.ts`  
**Date**: October 15, 2026  

---

## 1. Payment State Machine Definition & Invariant Rules

In high-value durable medical equipment (DME) commerce, maintaining rigorous parity between the payment processor (Stripe) and internal order persistence is paramount.

### Core Payment State Invariants:
1. **The Paid Invariant**: An order **MUST NOT** be set to `PAID` merely because payment authorization is pending or uncaptured.
2. **The Exact-Amount Invariant**: The paid amount **MUST EQUAL** the expected database total ($ \text{paidCents} == \text{expectedCents} $). Both underpayment and overpayment are rejected.
3. **The Single-Use Invariant**: A `payment_intent_id` is cryptographically unique and cannot be consumed by more than one order.
4. **The Terminal State Invariant**: Orders that reach terminal cancellation or refund states (`CANCELLED`, `REFUNDED`) cannot be regressed to `PAID` by out-of-order or late-arriving payment webhooks.

---

## 2. Stripe Intent Status to Order State Mapping

| Stripe PaymentIntent Status | Internal Order Status | Internal Payment Status | Fulfillment Permitted? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **`succeeded`** | `PAID` | `paid` | **YES** | Funds successfully captured and settled. |
| **`requires_capture`** | `AUTHORIZED` | `authorized` | **NO** | Funds held on customer card; must be captured before physical shipment. |
| **`processing`** | `PENDING` | `pending` | **NO** | Asynchronous payment in flight (e.g., ACH / bank debit). Awaits final settlement. |
| **`requires_payment_method`**| `PAYMENT_FAILED` | `failed` | **NO** | Card declined or authentication failed. Checkout throws HTTP 402. |
| **`canceled`** | `CANCELLED` | `cancelled` | **NO** | Intent expired or cancelled by customer. |
| **Amount Mismatch** | `PAYMENT_MISMATCH` | `underpaid` / `overpaid` | **NO** | Audit alert raised; merchant review required. |

---

## 3. Webhook Lifecycle & Concurrency Verification

### A. Webhook Fail-Closed Configuration
- When `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` is missing, `api/webhooks/stripe.ts` returns **HTTP 503 Service Unavailable**.
- **Impact**: Stripe interprets HTTP 503 as a temporary server failure and re-queues the event with exponential backoff (up to 72 hours), preventing dropped transactions.

### B. Duplicate & Out-of-Order Webhook Protection
- When Stripe fires duplicate webhooks for the same `payment_intent.succeeded` event, the second call performs an idempotent update. Because the order is already `PAID`, no redundant state change or stock mutation occurs.
- If an order has already transitioned to `CANCELLED` or `REFUNDED` (e.g., due to customer cancellation before capture), late-arriving `payment_intent.succeeded` events are explicitly blocked from regressing the order to `PAID`.

### C. Authorization Capture Updates
- When a manual-capture intent is authorized, Stripe emits `payment_intent.amount_capturable_updated`.
- The webhook updates the order to `status: 'AUTHORIZED'` and `payment_status: 'authorized'`, preventing unauthorized drop-ship dispatch to McKesson until funds are captured.

---

## 4. Payment Test Scenarios & Results

| Test Scenario | Input / Vector | Expected Behavior | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Exact Expected Amount** | $500 total, 50000¢ intent | Intent verified, order created | Order created, status `PAID` | **Verified PASS** |
| **Underpaid Intent** | $500 total, 100¢ intent | HTTP 400 Payment amount mismatch | Rejected with 400 `Payment amount mismatch (underpaid)` | **Verified PASS** |
| **Overpaid Intent** | $500 total, 60000¢ intent | HTTP 400 Payment amount mismatch | Rejected with 400 `Payment amount mismatch (overpaid)` | **Verified PASS** |
| **Currency Mismatch** | Currency = `EUR` | HTTP 400 Currency mismatch | Rejected with 400 `Payment currency mismatch. Expected USD` | **Verified PASS** |
| **Uncaptured Intent** | `status: 'requires_capture'` | Order set to `AUTHORIZED` | Mapped to `AUTHORIZED`, fulfillment locked | **Verified PASS** |
| **In-Flight Intent** | `status: 'processing'` | Order set to `PENDING` | Mapped to `PENDING`, awaiting settlement | **Verified PASS** |
| **Failed/Canceled Intent**| `status: 'requires_payment_method'` | HTTP 402 Payment not completed | Throws 402 with descriptive error | **Verified PASS** |
| **PaymentIntent Replay** | Same intent used on Order 2 | HTTP 409 Conflict | DB query detects existing usage, returns 409 | **Verified PASS** |
| **Partial Refund** | $200 refunded on $500 order | Order `PARTIALLY_REFUNDED` | Order marked `PARTIALLY_REFUNDED`, $300 balance remaining | **Verified PASS** |
| **Full Refund** | $500 refunded on $500 order | Order `REFUNDED` | Order marked `REFUNDED`, 0 balance remaining | **Verified PASS** |
| **Over-Refund Attempt** | $600 refunded on $500 order | Throws error exceeding balance | Rejected with error exceeding eligible balance | **Verified PASS** |
