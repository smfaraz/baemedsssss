# BaeMeds.com — Phase 4: Remediation Log

**Scope**: Confirmed Defects, Code Modifications, Impact Analysis, and Regression Test Coverage  
**Date**: October 15, 2026  
**Auditor**: Principal Application Security Engineer & QA Lead

---

## Remediation Index

| ID | Defect Description | Severity | Affected Files | Status | Regression Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | PaymentIntent Amount Tampering / Arbitrary Subtotal | **CRITICAL** | `api/payment-intent.ts`, `pages/CheckoutPage.tsx` | **FIXED** | `tests/adversarial-security.test.ts` (Test 1) |
| **DEF-02** | Unverified Stripe Payment Confirmation & Replay | **CRITICAL** | `api/checkout.ts` | **FIXED** | `tests/adversarial-security.test.ts` (Test 3) |
| **DEF-03** | Webhook Fail-Open on Missing Secret / Missing Signature | **CRITICAL** | `api/webhooks/stripe.ts` | **FIXED** | `tests/adversarial-security.test.ts` (Test 4.1, 4.2) |
| **DEF-04** | Webhook Underpayment Acceptance & State Regression | **HIGH** | `api/webhooks/stripe.ts` | **FIXED** | `tests/adversarial-security.test.ts` (Test 4.4, 4.5) |
| **DEF-05** | Customer Session Token Forgery Vulnerability | **HIGH** | `api/auth.ts`, `api/account.ts` | **FIXED** | `tests/adversarial-security.test.ts` (Test 5.1, 5.2) |
| **DEF-06** | Insecure Direct Object Reference (IDOR) & Anonymous Fallback | **HIGH** | `api/account.ts` | **FIXED** | `tests/adversarial-security.test.ts` (Test 5.3) |
| **DEF-07** | Unauthorized Refund Execution & Lack of Ceiling Guard | **HIGH** | `api/admin.ts` | **FIXED** | `tests/adversarial-security.test.ts` (Test 6.1, 6.2) |

---

## Detailed Remediation Entries

### DEF-01: PaymentIntent Amount Tampering
- **Severity**: Critical (CVSS 9.1)
- **Attack Scenario**: Attacker intercepted the POST payload to `/api/payment-intent` and altered `amount` to `$0.01` while ordering an $899 CPAP machine. Stripe created a valid 1¢ intent.
- **Root Cause**: `api/payment-intent.ts` accepted client-supplied `amount` without verifying item prices against the database catalog.
- **Fix Applied**: Added server-side catalog lookup. The server reads `items`, queries `products` in Supabase, calculates the authoritative total, enforces the $0.50 Stripe minimum, and forcibly overrides the client amount.
- **Verification**: `tests/adversarial-security.test.ts` Test 1 confirms server overrides tampered 100¢ payload with authoritative database total.

### DEF-02: Unverified Stripe Payment Confirmation & Intent Replay
- **Severity**: Critical (CVSS 8.9)
- **Attack Scenario**: Attacker called `/api/checkout` with `status: 'PAID'` and an unverified or previously used `paymentIntentId`.
- **Root Cause**: `/api/checkout.ts` did not verify the PaymentIntent against Stripe before setting `PAID`.
- **Fix Applied**: Server queries `stripe.paymentIntents.retrieve(paymentIntentId)` to verify `status === 'succeeded' || 'processing'`, `currency === 'usd'`, `amount >= expectedCents`, and queries the database to prevent reusing a consumed `payment_intent_id`.
- **Verification**: `tests/adversarial-security.test.ts` Test 3 confirms fake/underpaid intents are rejected.

### DEF-03: Webhook Fail-Open on Missing Secret
- **Severity**: Critical (CVSS 8.5)
- **Attack Scenario**: When environment secrets were missing or unconfigured, the webhook returned HTTP 200 `{ received: true }`, signaling Stripe that the event was processed and causing Stripe to never retry.
- **Root Cause**: Fail-open fallback in `api/webhooks/stripe.ts`.
- **Fix Applied**: Changed to HTTP 503 Fail-Closed with error logging, forcing Stripe to retain the event and retry. Added strict raw body signature verification returning HTTP 400 on failure.
- **Verification**: `tests/adversarial-security.test.ts` Test 4.1 verifies HTTP 503 is returned when secret is absent.

### DEF-04: Webhook Underpayment Acceptance & State Regression
- **Severity**: High (CVSS 7.8)
- **Attack Scenario**: An attacker pays an underpaid intent; webhook receives `payment_intent.succeeded` and blindly marks order `PAID`. Out-of-order webhooks could regress cancelled or refunded orders to `PAID`.
- **Root Cause**: Webhook updated order status without checking expected order total or checking existing order state.
- **Fix Applied**: Webhook retrieves order from DB, verifies `paymentIntent.amount >= expectedCents`, sets `PAYMENT_MISMATCH` if underpaid, and skips transition if order is already `CANCELLED` or `REFUNDED`.
- **Verification**: Confirmed via webhook logic inspection and adversarial test suite.

### DEF-05: Customer Session Token Forgery
- **Severity**: High (CVSS 7.5)
- **Attack Scenario**: Attacker base64-encoded an arbitrary victim's email into `bm_usr_${b64}_${timestamp}` and authenticated as that user.
- **Root Cause**: Token lacked cryptographic signature.
- **Fix Applied**: Implemented HMAC-SHA256 signature scheme (`bm_usr_${b64}_${sig}`) with hex digest and unambiguous parsing via `lastIndexOf('_')`.
- **Verification**: `tests/adversarial-security.test.ts` Test 5.1 confirms forged tokens are rejected with HTTP 401.

### DEF-06: Insecure Direct Object Reference (IDOR) & Anonymous Fallback
- **Severity**: High (CVSS 7.5)
- **Attack Scenario**: Anonymous user made requests to `/api/account` and gained access to `patient@example.com` address records.
- **Root Cause**: Fallback to hardcoded mock email on unauthenticated requests.
- **Fix Applied**: Removed fallback; unauthenticated requests return strict HTTP 401 Unauthorized.
- **Verification**: `tests/adversarial-security.test.ts` Test 5.3 confirms HTTP 401 response.

### DEF-07: Unauthorized Refund Execution
- **Severity**: High (CVSS 7.2)
- **Attack Scenario**: Support agent called `PATCH /api/admin/orders/:id` with `status: 'REFUNDED'` or `action: 'refund'`, issuing unauthorized financial credits.
- **Root Cause**: Order status update checked only `orders:manage` rather than `orders:refund`.
- **Fix Applied**: Enforced `orders:refund` privilege check (restricted to `super_admin`), added eligible balance ceiling calculation, and created audit logging.
- **Verification**: `tests/adversarial-security.test.ts` Test 6.2 confirms support agent is blocked with 403.
